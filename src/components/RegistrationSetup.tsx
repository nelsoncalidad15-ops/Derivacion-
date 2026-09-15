import React, { useEffect, useState } from 'react';
import { getRegistrationStatus, flushRegistrations } from '../services/registrationService';

export function RegistrationSetup() {
  const [status, setStatus] = useState(getRegistrationStatus);
  const [sending, setSending] = useState(false);
  useEffect(() => { const interval = setInterval(() => setStatus(getRegistrationStatus()), 1000); return () => clearInterval(interval); }, []);
  return <main className="max-w-lg mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-semibold">Estado del registro</h1>
    <p className="text-sm text-slate-600">Las derivaciones se envían automáticamente a Google Sheets. No necesitás ingresar una clave ni vincular esta tablet.</p>
    <div role="status" className="rounded-xl bg-slate-100 p-4 text-sm space-y-2">
      <p>Derivaciones pendientes de envío: <strong>{status.pending}</strong></p>
      {status.error && <p className="text-red-700 font-medium">Error: {status.error}</p>}
      {status.volatileStorage && <p className="text-red-700">No cierres esta pestaña: hay registros guardados solo en memoria.</p>}
    </div>
    <button disabled={sending} className="rounded-full bg-[#001e50] text-white px-5 py-3 disabled:opacity-50" onClick={async () => {
      setSending(true);
      try { await flushRegistrations(); }
      finally { setStatus(getRegistrationStatus()); setSending(false); }
    }}>{sending ? 'Enviando…' : 'Reintentar envíos pendientes'}</button>
    <a className="block py-3 underline text-slate-700" href="#">Volver al inicio</a>
  </main>;
}
