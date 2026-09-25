import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, UserRound } from 'lucide-react';
import { ResultadoDerivacion } from '../types';

export const RETURN_SECONDS = 20;
interface ResultCardProps {
  resultado: ResultadoDerivacion;
  asesor?: string;
  sinAsesor?: boolean;
  onNuevoIngreso: () => void;
}
export const ResultCard: React.FC<ResultCardProps> = ({ resultado, asesor, sinAsesor, onNuevoIngreso }) => {
  const [seconds, setSeconds] = useState(RETURN_SECONDS);
  const reset = useRef(onNuevoIngreso);
  reset.current = onNuevoIngreso;
  useEffect(() => {
    const until = Date.now() + RETURN_SECONDS * 1000;
    const interval = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 500);
    const timeout = window.setTimeout(() => reset.current(), RETURN_SECONDS * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);
  return (
    <section className="result-card" aria-labelledby="result-title">
      <CheckCircle2 size={44} strokeWidth={1.5} className="mx-auto mb-5 text-cyan-200" />
      <p className="text-sm text-blue-100 mb-3">Tu área de atención</p>
      <h1 id="result-title" className="text-3xl sm:text-4xl font-semibold tracking-tight">
        {resultado.canal === 'VENTA DIRECTA' ? 'Venta tradicional' : 'Planes de ahorro'}
      </h1>
      <p className="mt-7 text-xl font-semibold">¡Gracias por visitarnos!</p>
      {asesor ? <div className="assigned-advisor"><UserRound size={22}/><span>Te va a atender</span><strong>{asesor}</strong></div> : <p className="mt-3 text-blue-100 leading-relaxed">{sinAsesor ? 'Recepción está buscando un asesor disponible.' : 'Por favor, esperá unos minutos en recepción.'}<br />El equipo de esta área te acompañará.</p>}
      <button onClick={onNuevoIngreso} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#001e50] px-7 py-3 min-h-12 font-semibold">
        <ArrowLeft size={18} /> Volver al inicio
      </button>
      <p className="mt-4 text-xs text-blue-100">Volvemos al inicio en {seconds} segundos.</p>
    </section>
  );
};
