import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, UserRound, X } from 'lucide-react';
import { ResultadoDerivacion } from '../types';
import { Assignment, loadRound } from '../services/roundService';

export const RETURN_SECONDS = 20;
interface ResultCardProps {
  resultado: ResultadoDerivacion;
  asesor?: string;
  sinAsesor?: boolean;
  assignment?: Assignment | null;
  onBusyReassign: (observation: string) => boolean;
  onExceptionalReturn: (advisorId: string, observation: string) => boolean;
  onNuevoIngreso: () => void;
}
export const ResultCard: React.FC<ResultCardProps> = ({ resultado, asesor, sinAsesor, assignment, onBusyReassign, onExceptionalReturn, onNuevoIngreso }) => {
  const [seconds, setSeconds] = useState(RETURN_SECONDS);
  const [action, setAction] = useState<'BUSY' | 'RETURN' | null>(null);
  const [observation, setObservation] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const reset = useRef(onNuevoIngreso);
  reset.current = onNuevoIngreso;
  useEffect(() => {
    if (action) return;
    setSeconds(RETURN_SECONDS);
    const until = Date.now() + RETURN_SECONDS * 1000;
    const interval = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 500);
    const timeout = window.setTimeout(() => reset.current(), RETURN_SECONDS * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [action]);
  const advisors = assignment ? loadRound().advisors.filter(a => a.area === assignment.area) : [];
  const closeAction = () => { setAction(null); setObservation(''); setAdvisorId(''); };
  const confirm = () => {
    const ok = action === 'BUSY' ? onBusyReassign(observation) : onExceptionalReturn(advisorId, observation);
    if (ok || action === 'BUSY') closeAction();
  };
  return (
    <section className="result-card" aria-labelledby="result-title">
      <CheckCircle2 size={44} strokeWidth={1.5} className="mx-auto mb-5 text-cyan-200" />
      <p className="text-sm text-blue-100 mb-3">Tu área de atención</p>
      <h1 id="result-title" className="text-3xl sm:text-4xl font-semibold tracking-tight">
        {resultado.canal === 'VENTA DIRECTA' ? 'Venta tradicional' : 'Planes de ahorro'}
      </h1>
      <p className="mt-7 text-xl font-semibold">¡Gracias por visitarnos!</p>
      {asesor ? <div className="assigned-advisor"><UserRound size={22}/><span>Te va a atender</span><strong>{asesor}</strong></div> : <p className="mt-3 text-blue-100 leading-relaxed">{sinAsesor ? 'Recepción está buscando un asesor disponible.' : 'Por favor, esperá unos minutos en recepción.'}<br />El equipo de esta área te acompañará.</p>}
      {assignment && <div className="result-reception-actions" aria-label="Acciones de recepción"><span>Acciones de recepción</span><div><button onClick={() => setAction('BUSY')}>Está ocupado</button><button onClick={() => setAction('RETURN')}>Devolver atención</button></div></div>}
      {action && <div className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-title"><div className="action-dialog-head"><div><small>{action === 'BUSY' ? 'Cambio de asesor' : 'Excepción de jefatura'}</small><h2 id="action-title">{action === 'BUSY' ? '¿Por qué está ocupado?' : 'Devolver la atención'}</h2></div><button aria-label="Cerrar" onClick={closeAction}><X size={20}/></button></div>{action === 'RETURN' && <label>Asesor solicitado<select value={advisorId} onChange={e => setAdvisorId(e.target.value)}><option value="">Seleccionar asesor…</option>{advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}<label>Observación<textarea autoFocus maxLength={180} value={observation} onChange={e => setObservation(e.target.value)} placeholder={action === 'BUSY' ? 'Ej.: está entregando una unidad, está con otro cliente…' : 'Ej.: el jefe solicita que retome esta atención…'}/></label><p>Quedará guardado en el historial y se enviará a Sheets.</p><button className="confirm-action" disabled={!observation.trim() || (action === 'RETURN' && !advisorId)} onClick={confirm}>{action === 'BUSY' ? 'Guardar y pasar al siguiente' : 'Guardar devolución'}</button></div>}
      <button onClick={onNuevoIngreso} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#001e50] px-7 py-3 min-h-12 font-semibold">
        <ArrowLeft size={18} /> Volver al inicio
      </button>
      {!action && <p className="mt-4 text-xs text-blue-100">Volvemos al inicio en {seconds} segundos.</p>}
    </section>
  );
};
