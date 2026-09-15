export type CanalDefinitivo = 'VENTA DIRECTA' | 'PLANES DE AHORRO';
export type TipoRegistro = 'Tradicional' | 'Planes';
export interface Registration { id: string; tipo: TipoRegistro; fecha: string; }
export interface Receipt { ok: true; id: string; cliente: string; asesor: string; }
export interface Connection { url: string; key: string; }
const CONNECTION = 'AUTOSOL_REGISTRO_CONEXION';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqNzvh_c1pLRmxPe2dEW1KluZ9hsGmBoP6u518t0NBmNiSzloFpPoy-8wlQkHCo3ha_A/exec';
const PREFIX = 'AUTOSOL_PENDIENTE_';
const memory = new Map<string, Registration>();
let running: Promise<void> | undefined;
let lastError = '';
let volatileStorage = false;
const listeners = new Map<string, (receipt: Receipt) => void>();

export function getConnection(): Connection {
  try {
    const saved = JSON.parse(localStorage.getItem(CONNECTION) || 'null');
    return {
      url: typeof saved?.url === 'string' && saved.url ? saved.url : DEFAULT_SCRIPT_URL,
      key: typeof saved?.key === 'string' ? saved.key : '',
    };
  } catch { return { url: DEFAULT_SCRIPT_URL, key: '' }; }
}
export function saveConnection(connection: Connection) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(connection.url)) throw new Error('Pegá la URL de Apps Script que termina en /exec.');
  if (connection.key.length < 32) throw new Error('Usá la clave generada en Apps Script.');
  localStorage.setItem(CONNECTION, JSON.stringify(connection));
}
export function getPending(): Registration[] {
  const entries = new Map(memory);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const item = JSON.parse(localStorage.getItem(key) || 'null');
      if (item?.id && (item.tipo === 'Tradicional' || item.tipo === 'Planes')) entries.set(item.id, item);
    }
  } catch { lastError = 'No se pudo leer el almacenamiento de esta tablet.'; }
  return [...entries.values()].sort((a,b) => a.fecha.localeCompare(b.fecha));
}
export function getRegistrationStatus() {
  return { pending: getPending().length, error: lastError, volatileStorage, configured: Boolean(getConnection().url && getConnection().key) };
}
export function queueRegistration(id: string, canal: CanalDefinitivo, onReceipt?: (receipt: Receipt) => void) {
  const item: Registration = { id, tipo: canal === 'VENTA DIRECTA' ? 'Tradicional' : 'Planes', fecha: new Date().toISOString() };
  if (!getPending().some(entry => entry.id === id)) {
    memory.set(id, item);
    try { localStorage.setItem(PREFIX + id, JSON.stringify(item)); }
    catch { volatileStorage = true; lastError = 'Almacenamiento no disponible: mantené esta pestaña abierta hasta sincronizar.'; }
  }
  if (onReceipt) listeners.set(id, onReceipt);
  void flushRegistrations();
}
export function stopReceiptListener(id: string) { listeners.delete(id); }
export function flushRegistrations(): Promise<void> {
  if (running) return running;
  running = flush().finally(() => { running = undefined; });
  return running;
}
async function flush() {
  const { url, key } = getConnection();
  if (!url || !key) return;
  for (const item of getPending()) {
    try {
      const response = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...item, key }), redirect: 'follow', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('No se pudo contactar con Google Sheets.');
      const receipt = await response.json();
      if (receipt.ok !== true || receipt.id !== item.id || typeof receipt.cliente !== 'string' || typeof receipt.asesor !== 'string') {
        throw new Error(receipt.error === 'unauthorized' ? 'La clave de esta tablet no es válida.' : 'El registro no fue confirmado por Google Sheets.');
      }
      // Only discard after explicit acknowledgement. A retry reuses the same ID.
      localStorage.removeItem(PREFIX + item.id);
      memory.delete(item.id);
      listeners.get(item.id)?.(receipt);
      listeners.delete(item.id);
      lastError = '';
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Error al sincronizar.';
      return;
    }
  }
}
