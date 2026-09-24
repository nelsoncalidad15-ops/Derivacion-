import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, UserRound, Wifi } from 'lucide-react';
import { ResultadoDerivacion } from '../types';
import { Receipt } from '../services/registrationService';

export const RETURN_SECONDS = 20;
interface ResultCardProps {
  resultado: ResultadoDerivacion;
  comprobante: Receipt | null;
  onNuevoIngreso: () => void;
}

/**
 * El área se determina inmediatamente en la tablet. El número y el asesor
 * solamente se muestran tras el acuse de Apps Script: nunca son estimaciones.
 * El retorno automático comienza con la confirmación, no con el clic inicial.
 */
export const ResultCard: React.FC<ResultCardProps> = ({ resultado, comprobante, onNuevoIngreso }) => {
  const [seconds, setSeconds] = useState(RETURN_SECONDS);
  const reset = useRef(onNuevoIngreso);
  reset.current = onNuevoIngreso;
  useEffect(() => {
    setSeconds(RETURN_SECONDS);
    if (!comprobante) return;
    const until = Date.now() + RETURN_SECONDS * 1000;
    const interval = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 500);
    const timeout = window.setTimeout(() => reset.current(), RETURN_SECONDS * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [comprobante?.id]);

  const area = resultado.canal === 'VENTA DIRECTA' ? 'Venta tradicional' : 'Planes de ahorro';
  const asesor = comprobante?.asesor?.trim();
  return (
    <section className="result-card" aria-labelledby="result-title">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        {comprobante ? <CheckCircle2 size={36} strokeWidth={1.7} className="text-cyan-200" />
          : <Clock3 size={36} strokeWidth={1.7} className="text-cyan-200" />}
      </div>
      <p className="text-xs uppercase tracking-[.22em] text-cyan-100 mb-3">Tu área de atención</p>
      <h1 id="result-title" className="text-3xl sm:text-4xl font-semibold tracking-tight">{area}</h1>

      {comprobante ? (
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5" role="status" aria-live="polite">
          <p className="text-xs uppercase tracking-widest text-blue-100">Tu número de atención</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">{comprobante.cliente}</p>
          {asesor ? (
            <div className="mt-5 border-t border-white/20 pt-4">
              <p className="flex justify-center items-center gap-2 text-sm text-blue-100"><UserRound size={17} /> Te recibe</p>
              <p className="mt-2 text-xl sm:text-2xl font-semibold">{asesor}</p>
            </div>
          ) : (
            <p className="mt-4 border-t border-white/20 pt-4 text-sm text-blue-100">
              {comprobante.estado === 'Sin asesor disponible'
                ? 'Tu visita está registrada. Recepción te indicará cuándo haya un asesor disponible.'
                : 'Tu visita está registrada. Recepción te indicará quién te atenderá.'}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5" role="status" aria-live="polite">
          <p className="flex items-center justify-center gap-2 font-semibold"><Wifi size={18} /> Confirmando tu atención…</p>
          <p className="mt-3 text-sm leading-relaxed text-blue-100">
            Ya sabemos a qué área dirigirte. El número de cliente y el asesor aparecerán cuando se confirme el registro.
          </p>
          <p className="mt-3 text-xs text-blue-100">Si hay una demora de conexión, el envío queda pendiente y se reintenta automáticamente.</p>
        </div>
      )}
      <p className="mt-6 text-lg font-semibold">¡Gracias por visitarnos!</p>
      <p className="mt-2 text-sm text-blue-100 leading-relaxed">Por favor, esperá unos minutos en recepción.<br />El equipo de esta área te acompañará.</p>
      <button onClick={onNuevoIngreso} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#001e50] px-7 py-3 min-h-12 font-semibold">
        <ArrowLeft size={18} /> Nuevo cliente
      </button>
      {comprobante
        ? <p className="mt-4 text-xs text-blue-100">Volvemos al inicio en {seconds} segundos.</p>
        : <p className="mt-4 text-xs text-blue-100">También podés registrar otra visita; esta seguirá pendiente hasta confirmarse.</p>}
    </section>
  );
};
