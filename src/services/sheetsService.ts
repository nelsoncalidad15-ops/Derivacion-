import { AppData, Configuracion, Opcion, Pregunta } from '../types';
import { DEFAULT_CONFIG, INITIAL_OPCIONES, INITIAL_PREGUNTAS } from '../data/initialData';

// Simple CSV parser supporting quotes and standard separators
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    result.push(field.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h) =>
    h.toUpperCase().replace(/^"|"$/g, '').trim()
  );

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

// Extract Sheet ID from either a raw ID or a full Google Sheet URL
export function extractSheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]+$/.test(trimmed)) return trimmed;
  return trimmed;
}

// Service helper methods
export async function fetchSheetTab(sheetId: string, tabName: string): Promise<Record<string, string>[]> {
  const cleanId = extractSheetId(sheetId);
  if (!cleanId) throw new Error('Google Sheet ID inválido o vacío');

  // Attempt using gviz endpoint
  const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} al intentar leer la pestaña '${tabName}'.`);
  }

  const csvText = await res.text();
  if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-site-verification')) {
    throw new Error(
      `El Google Sheet no es público. Asegurate de configurar el acceso a 'Cualquier persona con el enlace' o 'Publicar en la web'.`
    );
  }

  return parseCSV(csvText);
}

export async function getConfiguracion(sheetId?: string): Promise<Configuracion> {
  if (!sheetId) return { ...DEFAULT_CONFIG };
  try {
    const rows = await fetchSheetTab(sheetId, 'CONFIGURACION');
    const config: Configuracion = { ...DEFAULT_CONFIG, GOOGLE_SHEET_ID: sheetId };

    rows.forEach((row) => {
      const key = (row['PARAMETRO'] || row['PARAMETROS'] || row['KEY'] || '').toUpperCase().trim();
      const val = row['VALOR'] || row['VALUE'] || '';
      if (key) {
        if (key === 'UMBRAL_DIFERENCIA' || key === 'ANIO_CORTE_USADO' || key === 'KM_CORTE_USADO') {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            config[key] = num;
          }
        } else {
          config[key] = val;
        }
      }
    });

    return config;
  } catch (err) {
    console.warn('Error fetching CONFIGURACION from Google Sheet, using default config:', err);
    return { ...DEFAULT_CONFIG, GOOGLE_SHEET_ID: sheetId };
  }
}

export async function getPreguntas(sheetId?: string): Promise<Pregunta[]> {
  if (!sheetId) return [...INITIAL_PREGUNTAS];
  try {
    const rows = await fetchSheetTab(sheetId, 'PREGUNTAS');
    if (!rows.length) return [...INITIAL_PREGUNTAS];

    const preguntas: Pregunta[] = rows.map((row) => {
      const id = row['ID'] || row['PREGUNTA_ID'] || `p_${Math.random()}`;
      const orden = parseInt(row['ORDEN'] || '0', 10) || 0;
      const preguntaText = row['PREGUNTA'] || '';
      const ayuda = row['AYUDA'] || '';
      const tipoRaw = (row['TIPO'] || 'STANDARD').toUpperCase().trim();
      const condicion = (row['CONDICION'] || '').toUpperCase().trim();
      const activaStr = (row['ACTIVA'] || 'SI').toUpperCase().trim();
      const activa = activaStr === 'SI' || activaStr === 'TRUE' || activaStr === '1' || activaStr === 'S';

      let tipo: Pregunta['tipo'] = 'STANDARD';
      if (tipoRaw === 'ACCESO_RAPIDO' || tipoRaw === 'FAST') tipo = 'ACCESO_RAPIDO';
      if (tipoRaw === 'VEHICULO_GATEWAY') tipo = 'VEHICULO_GATEWAY';
      if (tipoRaw === 'USADO_GATEWAY' || tipoRaw === 'GATEWAY') tipo = 'USADO_GATEWAY';

      return {
        id,
        orden,
        pregunta: preguntaText,
        ayuda,
        tipo,
        condicion,
        activa,
      };
    });

    return preguntas.sort((a, b) => a.orden - b.orden);
  } catch (err) {
    console.warn('Error fetching PREGUNTAS from Google Sheet, fallback to initial:', err);
    return [...INITIAL_PREGUNTAS];
  }
}

export async function getOpciones(sheetId?: string): Promise<Opcion[]> {
  if (!sheetId) return [...INITIAL_OPCIONES];
  try {
    const rows = await fetchSheetTab(sheetId, 'OPCIONES');
    if (!rows.length) return [...INITIAL_OPCIONES];

    const opciones: Opcion[] = rows.map((row) => {
      const pregunta_id = row['PREGUNTA_ID'] || row['PREGUNTA'] || '';
      const opcion_id = row['OPCION_ID'] || row['ID'] || `o_${Math.random()}`;
      const texto = row['TEXTO'] || row['OPCION'] || '';
      const ayuda = row['AYUDA'] || '';
      const puntos_directa = parseInt(row['PUNTOS_DIRECTA'] || row['DIRECTA'] || '0', 10) || 0;
      const puntos_planes = parseInt(row['PUNTOS_PLANES'] || row['PLANES'] || '0', 10) || 0;

      let canal_directo: Opcion['canal_directo'] = undefined;
      const canalRaw = (row['CANAL_DIRECTO'] || '').toUpperCase().trim();
      if (canalRaw.includes('DIRECTA')) canal_directo = 'VENTA DIRECTA';
      else if (canalRaw.includes('PLAN')) canal_directo = 'PLANES DE AHORRO';
      else if (canalRaw.includes('ORIENTAR')) canal_directo = 'ORIENTAR';

      // Smart fallback for fast access if text matches known initial prompt options
      if (pregunta_id === 'p_fast') {
        if (texto.toLowerCase().includes('directa') || texto.toLowerCase().includes('financ')) {
          canal_directo = 'VENTA DIRECTA';
        } else if (texto.toLowerCase().includes('plan')) {
          canal_directo = 'PLANES DE AHORRO';
        } else {
          canal_directo = 'ORIENTAR';
        }
      }

      return {
        pregunta_id,
        opcion_id,
        texto,
        ayuda,
        puntos_directa,
        puntos_planes,
        canal_directo,
      };
    });

    return opciones;
  } catch (err) {
    console.warn('Error fetching OPCIONES from Google Sheet, fallback to initial:', err);
    return [...INITIAL_OPCIONES];
  }
}

export async function loadAppData(sheetId?: string): Promise<AppData> {
  const cleanId = extractSheetId(sheetId || '');
  if (!cleanId) {
    return {
      preguntas: INITIAL_PREGUNTAS,
      opciones: INITIAL_OPCIONES,
      configuracion: DEFAULT_CONFIG,
      origenDatos: 'DEMO',
      ultimaActualizacion: new Date(),
    };
  }

  try {
    const [config, preguntas, opciones] = await Promise.all([
      getConfiguracion(cleanId),
      getPreguntas(cleanId),
      getOpciones(cleanId),
    ]);

    return {
      preguntas,
      opciones,
      configuracion: config,
      origenDatos: 'SHEETS',
      sheetIdUsado: cleanId,
      ultimaActualizacion: new Date(),
    };
  } catch (err: any) {
    return {
      preguntas: INITIAL_PREGUNTAS,
      opciones: INITIAL_OPCIONES,
      configuracion: DEFAULT_CONFIG,
      origenDatos: 'DEMO',
      sheetIdUsado: cleanId,
      ultimaActualizacion: new Date(),
      errorSync: err?.message || 'Error al conectar con Google Sheet.',
    };
  }
}
