export type CanalDefinitivo = 'VENTA DIRECTA' | 'PLANES DE AHORRO';
export type TipoRegistro = 'Tradicional' | 'Planes';
export interface Registration { id: string; tipo: TipoRegistro; fecha: string; }
export interface Receipt { ok: true; id: string; cliente: string; asesor: string; }
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqNzvh_c1pLRmxPe2dEW1KluZ9hsGmBoP6u518t0NBmNiSzloFpPoy-8wlQkHCo3ha_A/exec';
const PREFIX = 'AUTOSOL_PENDIENTE_';
const memory = new Map<string, Registration>();
let running: Promise<void> | undefined;
let lastError = '';
let volatileStorage = false;
const listeners = new Map<string, (receipt: Receipt) => void>();

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
  return { pending: getPending().length, error: lastError, volatileStorage, configured: true };
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
  running = flush().finally(() => {
    running = undefined;
  });
  return running;
}
async function flush() {
  // Refresh after each acknowledgement to include arrivals during an active request.
  // On failure, leave retrying to the app timer or the online event.
  let item: Registration | undefined;
  while ((item = getPending()[0])) {
    try {
      const response = await fetch(DEFAULT_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(item), redirect: 'follow', signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('No se pudo contactar con Google Sheets.');
      const receipt = await response.json();
      if (receipt.error === 'busy') {
        throw new Error('Google Sheets está ocupado. Se reintentará automáticamente.');
      }
      if (receipt.ok !== true || receipt.id !== item.id || typeof receipt.cliente !== 'string' || typeof receipt.asesor !== 'string') {
        const errors: Record<string, string> = {
          unauthorized: 'Actualizá la implementación de Apps Script: todavía solicita la clave anterior.',
          not_configured: 'Falta ejecutar prepararRegistro en Apps Script.',
          server_error: 'Apps Script no pudo guardar el registro. Revisá las ejecuciones del script.',
        };
        throw new Error(errors[receipt.error] || 'El registro no fue confirmado por Google Sheets.');
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
