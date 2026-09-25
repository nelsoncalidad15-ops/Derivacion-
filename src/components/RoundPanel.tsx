import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, UserRoundCheck } from 'lucide-react';
import { addAdvisor, loadRound, nextAdvisor, overrideAssignment, reassignBusy, removeAdvisor, RoundArea, RoundState, updateAdvisor } from '../services/roundService';
import { queueAssignmentUpdate } from '../services/registrationService';

export function RoundPanel({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<RoundState>(loadRound);
  const [name, setName] = useState(''); const [area, setArea] = useState<RoundArea>('Tradicional');
  const [overrideId, setOverrideId] = useState('');
  const [busyObservation, setBusyObservation] = useState('');
  const refresh = (next: RoundState) => setState({ ...next });
  const latest = state.assignments.at(-1);
  return <main className="round-page">
    <div className="round-toolbar"><button className="round-back" onClick={onClose}><ArrowLeft size={18}/> Volver al derivador</button><div><span className="round-kicker">Control de recepción</span><h1>¿Cómo va la ronda?</h1></div></div>
    <section className="round-next-grid">
      {(['Tradicional', 'Planes'] as RoundArea[]).map(kind => { const next = nextAdvisor(kind, state); return <article className="round-next" key={kind}><span>{kind === 'Tradicional' ? 'Venta tradicional' : 'Planes de ahorro'}</span><strong>{next?.name || 'Sin asesor disponible'}</strong><small>Próximo en recibir</small></article>; })}
    </section>
    {latest && <section className="round-card active-assignment"><div><span className="round-kicker">Atención más reciente</span><h2>{latest.advisorName}</h2><p>{latest.area} · {latest.status}</p></div><div className="assignment-actions"><div className="busy-reassign"><input aria-label="Observación del cambio de asesor" value={busyObservation} onChange={e => setBusyObservation(e.target.value)} maxLength={180} placeholder="Observación (opcional)"/><button className="busy-action" onClick={() => { const result = reassignBusy(latest.id, busyObservation); refresh(result.state); if (result.assignment) queueAssignmentUpdate(result.assignment.visitId, result.assignment.area, { id: result.assignment.advisorId, name: result.assignment.advisorName }, 'Asesor ocupado', busyObservation); setBusyObservation(''); }}>Está ocupado: rederivar</button></div><select aria-label="Asesor para devolución excepcional" value={overrideId} onChange={e => setOverrideId(e.target.value)}><option value="">Devolución excepcional…</option>{state.advisors.filter(a => a.area === latest.area).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><button disabled={!overrideId} onClick={() => { const result = overrideAssignment(latest.id, overrideId); refresh(result.state); if (result.assignment) queueAssignmentUpdate(result.assignment.visitId, result.assignment.area, { id: result.assignment.advisorId, name: result.assignment.advisorName }, 'Pedido del jefe'); setOverrideId(''); }}>Asignar por pedido del jefe</button></div></section>}
    <section className="round-card">
      <h2>Equipo y disponibilidad</h2><p>Marcá “Ocupado” cuando un asesor no pueda recibir. Al liberarlo conserva el turno que perdió.</p>
      <div className="round-teams">{(['Tradicional', 'Planes'] as RoundArea[]).map(kind => <div key={kind}><h3>{kind === 'Tradicional' ? 'Venta tradicional' : 'Planes de ahorro'}</h3>
        {state.advisors.filter(a => a.area === kind).length === 0 && <div className="round-empty">Agregá el primer asesor.</div>}
        {state.advisors.filter(a => a.area === kind).map(a => <div className="advisor-row" key={a.id}><UserRoundCheck size={20}/><span>{a.name}</span><label className="busy-toggle"><input type="checkbox" checked={a.busy} onChange={e => refresh(updateAdvisor(a.id, { busy: e.target.checked }))}/><span>{a.busy ? 'Ocupado' : 'Disponible'}</span></label><button aria-label={`Eliminar a ${a.name}`} onClick={() => refresh(removeAdvisor(a.id))}><Trash2 size={17}/></button></div>)}
      </div>)}</div>
      <form className="add-advisor" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; refresh(addAdvisor(name, area)); setName(''); }}><input aria-label="Nombre del asesor" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del asesor"/><select aria-label="Área" value={area} onChange={e => setArea(e.target.value as RoundArea)}><option value="Tradicional">Venta tradicional</option><option value="Planes">Planes de ahorro</option></select><button><Plus size={18}/> Agregar</button></form>
    </section>
    <section className="round-card"><h2>Últimos movimientos</h2>{state.assignments.length === 0 ? <p className="round-empty">Todavía no hay asignaciones locales.</p> : <div className="movement-list">{state.assignments.slice(-8).reverse().map(item => <div key={item.id}><strong>{item.advisorName}</strong><span>{item.area} · {item.status}{item.observation && <small className="movement-observation">Observación: {item.observation}</small>}</span><time>{new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div>}</section>
  </main>;
}
