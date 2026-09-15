export interface Pregunta {
  id: string;
  orden: number;
  pregunta: string;
  ayuda: string;
  tipo: 'ACCESO_RAPIDO' | 'USADO_GATEWAY' | 'VEHICULO_GATEWAY' | 'STANDARD';
  condicion: string; // e.g. "TIENE_USADO"
  activa: boolean;
}

export interface Opcion {
  pregunta_id: string;
  opcion_id: string;
  texto: string;
  ayuda: string;
  puntos_directa: number;
  puntos_planes: number;
  canal_directo?: 'VENTA DIRECTA' | 'PLANES DE AHORRO' | 'ORIENTAR';
}

export interface Configuracion {
  GOOGLE_SHEET_ID: string;
  NOMBRE_CONCESIONARIO: string;
  UMBRAL_DIFERENCIA: number;
  ANIO_CORTE_USADO: number;
  KM_CORTE_USADO: number;
  [key: string]: any;
}

export type CanalDerivacion = 'VENTA DIRECTA' | 'PLANES DE AHORRO' | 'AMBAS ALTERNATIVAS' | 'PERFIL MIXTO';

export interface MotivoContribucion {
  preguntaTexto: string;
  opcionTexto: string;
  puntos: number;
}

export interface ResultadoDerivacion {
  canal: CanalDerivacion;
  puntosDirecta: number;
  puntosPlanes: number;
  diferencia: number;
  umbral: number;
  motivosPrincipales: MotivoContribucion[];
  esAccesoRapido: boolean;
}

export interface AppData {
  preguntas: Pregunta[];
  opciones: Opcion[];
  configuracion: Configuracion;
  origenDatos: 'SHEETS' | 'DEMO';
  sheetIdUsado?: string;
  ultimaActualizacion?: Date;
  errorSync?: string;
}
