import React, { useEffect, useState } from 'react';
import { getConnection, getRegistrationStatus, saveConnection, flushRegistrations } from '../services/registrationService';

// Setup is outside the customer flow. Knowing this URL grants no Sheet access:
// writes still require the tablet key, validated only by Apps Script.
export function RegistrationSetup() {
  const [connection, setConnection] = useState(getConnection);
  const [status, setStatus] = useState(getRegistrationStatus);
  const [message, setMessage] = useState('');
  useEffect(() => { const interval = setInterval(() => setStatus(getRegistrationStatus()), 1000); return () => clearInterval(interval); }, []);
  return <main className="max-w-lg mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-semibold">Configurar esta tablet</h1>
    <p className="text-sm text-slate-600">Conexión privada al registro de derivaciones. Esta pantalla no forma parte del recorrido del cliente.</p>
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault();
      try { saveConnection(connection); setMessage('Configuración guardada en esta tablet.'); await flushRegistrations(); setStatus(getRegistrationStatus()); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    }}>
      <label className="block text-sm">URL de Apps Script<input className="block border rounded-lg w-full p-3 mt-2" type="url" required value={connection.url} onChange={e => setConnection({ ...connection, url: e.target.value.trim() })} /></label>
      <label className="block text-sm">Clave de la tablet<input className="block border rounded-lg w-full p-3 mt-2" type="password" autoComplete="off" required value={connection.key} onChange={e => setConnection({ ...connection, key: e.target.value.trim() })} /></label>
      <button className="rounded-full bg-[#001e50] text-white px-5 py-3">Guardar y sincronizar</button>
    </form>
    <p role="status" className="text-sm">{message}</p>
    <div className="rounded-xl bg-slate-100 p-4 text-sm space-y-2">
      <p className={status.configured ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
        {status.configured ? '✓ Conexión configurada' : '⚠ Conexión no configurada (falta la clave o URL)'}
      </p>
      <p>Derivaciones pendientes de envío: <strong>{status.pending}</strong></p>
      {status.error && <p className="text-red-700 font-medium">Error: {status.error}</p>}
      {status.volatileStorage && <p className="text-red-700">No cierres esta pestaña: hay registros guardados solo en memoria.</p>}
    </div>
    <div className="text-xs text-slate-500 space-y-1">
      <p><strong>¿Dónde encuentro la clave?</strong></p>
      <p>1. En tu Google Sheet, abrí el menú superior <strong>Autosol → Ver clave de conexión</strong>.</p>
      <p>2. Si no aparece el menú, en Apps Script ejecutá la función <code>prepararRegistro</code> y recargá la planilla.</p>
    </div>
    <a className="inline-block py-3 underline cursor-pointer text-slate-700 hover:text-slate-900" href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}>Volver al inicio</a>
  </main>;
}
