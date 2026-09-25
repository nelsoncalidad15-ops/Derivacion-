import { CanalDefinitivo } from './registrationService';

export type RoundArea = 'Tradicional' | 'Planes';
export interface Advisor { id: string; name: string; area: RoundArea; busy: boolean; }
export interface Assignment { id: string; visitId: string; area: RoundArea; advisorId: string; advisorName: string; createdAt: string; status: 'Asignado' | 'Redirigido' | 'Excepción'; observation?: string; }
export interface RoundState { advisors: Advisor[]; queues: Record<RoundArea, string[]>; assignments: Assignment[]; }

const KEY = 'AUTOSOL_RONDA_LOCAL_V1';
const DEFAULT_ADVISORS: Advisor[] = [
  ['EMMANUEL BRUZZONE', 'Tradicional'], ['RODRIGO CAVION', 'Planes'],
  ['EDGAR LAMONACA', 'Tradicional'], ['PABLO LOPEZ', 'Tradicional'],
  ['DARIO RODRIGUEZ', 'Planes'], ['ENZO BRANCICH', 'Tradicional'],
  ['FACUNDO BARRIOS', 'Planes'], ['DAVID GOMEZ', 'Planes'],
  ['SCHLEGEL JUAN', 'Planes'], ['ROBLEDO PABLO', 'Planes'],
  ['MENDIZABAL LIONEL', 'Planes'], ['ARIADNA PETRUCIOLI', 'Planes'],
  ['HORACIO ZELAYA', 'Planes'], ['CESAR ESPIN', 'Tradicional'],
  ['VANESA ZAMBRANO', 'Planes'], ['ROMINA GARECA', 'Tradicional'],
  ['MATIAS FACTTORI', 'Tradicional'], ['RAMIRO BENICIO', 'Tradicional'],
  ['EMILSE DIAZ', 'Planes'], ['GASTON BASTOS', 'Tradicional'],
  ['EZEQUIEL YANEZ', 'Planes'], ['LUIS FERREYRA', 'Planes'],
].map(([name, area], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: name as string,
  area: area as RoundArea,
  busy: false,
}));
const empty = (): RoundState => {
  const advisors = DEFAULT_ADVISORS.map(advisor => ({ ...advisor }));
  return {
    advisors,
    queues: {
      Tradicional: advisors.filter(a => a.area === 'Tradicional').map(a => a.id),
      Planes: advisors.filter(a => a.area === 'Planes').map(a => a.id),
    },
    assignments: [],
  };
};
const areaFor = (channel: CanalDefinitivo): RoundArea => channel === 'VENTA DIRECTA' ? 'Tradicional' : 'Planes';

export function loadRound(): RoundState {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed?.advisors && parsed?.queues && parsed?.assignments) {
      // Migrate an untouched empty roster created by the previous release.
      if (parsed.advisors.length === 0 && parsed.assignments.length === 0) {
        const seeded = empty(); saveRound(seeded); return seeded;
      }
      return normalize(parsed);
    }
  } catch { /* Start with a clean local round if storage was corrupted. */ }
  return empty();
}

function normalize(state: RoundState): RoundState {
  const advisors = state.advisors.filter(a => a.id && a.name && (a.area === 'Tradicional' || a.area === 'Planes'));
  const queues = { Tradicional: [] as string[], Planes: [] as string[] };
  (['Tradicional', 'Planes'] as RoundArea[]).forEach(area => {
    const valid = new Set(advisors.filter(a => a.area === area).map(a => a.id));
    const saved = (state.queues[area] || []).filter((id, i, all) => valid.has(id) && all.indexOf(id) === i);
    queues[area] = [...saved, ...[...valid].filter(id => !saved.includes(id))];
  });
  return { advisors, queues, assignments: (state.assignments || []).slice(-100) };
}

export function saveRound(state: RoundState) {
  localStorage.setItem(KEY, JSON.stringify(normalize(state)));
  window.dispatchEvent(new Event('autosol-round-change'));
}

export function addAdvisor(name: string, area: RoundArea): RoundState {
  const state = loadRound();
  const advisor: Advisor = { id: crypto.randomUUID(), name: name.trim(), area, busy: false };
  state.advisors.push(advisor); state.queues[area].push(advisor.id); saveRound(state); return state;
}

export function updateAdvisor(id: string, changes: Partial<Pick<Advisor, 'name' | 'busy'>>): RoundState {
  const state = loadRound();
  state.advisors = state.advisors.map(a => a.id === id ? { ...a, ...changes, name: changes.name?.trim() || a.name } : a);
  saveRound(state); return state;
}

export function removeAdvisor(id: string): RoundState {
  const state = loadRound(); state.advisors = state.advisors.filter(a => a.id !== id);
  state.queues.Tradicional = state.queues.Tradicional.filter(x => x !== id); state.queues.Planes = state.queues.Planes.filter(x => x !== id);
  saveRound(state); return state;
}

/** The first available person is served. Skipped busy people keep priority. */
export function assignNext(visitId: string, channel: CanalDefinitivo): Assignment | null {
  const state = loadRound(); const area = areaFor(channel); const queue = state.queues[area];
  const index = queue.findIndex(id => !state.advisors.find(a => a.id === id)?.busy);
  if (index < 0) return null;
  const [id] = queue.splice(index, 1); queue.push(id);
  const advisor = state.advisors.find(a => a.id === id)!;
  const assignment: Assignment = { id: crypto.randomUUID(), visitId, area, advisorId: id, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Asignado' };
  state.assignments.push(assignment); saveRound(state); return assignment;
}

export function reassignBusy(assignmentId: string, observation = ''): { state: RoundState; assignment: Assignment | null } {
  const state = loadRound(); const current = state.assignments.find(a => a.id === assignmentId);
  if (!current) return { state, assignment: null };
  const old = state.advisors.find(a => a.id === current.advisorId); if (old) old.busy = true;
  state.queues[current.area] = [current.advisorId, ...state.queues[current.area].filter(id => id !== current.advisorId)];
  const index = state.queues[current.area].findIndex(id => !state.advisors.find(a => a.id === id)?.busy);
  if (index < 0) { saveRound(state); return { state, assignment: null }; }
  const [id] = state.queues[current.area].splice(index, 1); state.queues[current.area].push(id);
  const advisor = state.advisors.find(a => a.id === id)!;
  const replacement: Assignment = { ...current, id: crypto.randomUUID(), advisorId: id, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Redirigido', observation: observation.trim() || undefined };
  state.assignments.push(replacement); saveRound(state); return { state, assignment: replacement };
}

/** A manager override intentionally leaves the normal queue untouched. */
export function overrideAssignment(assignmentId: string, advisorId: string, observation = ''): { state: RoundState; assignment: Assignment | null } {
  const state = loadRound(); const current = state.assignments.find(a => a.id === assignmentId); const advisor = state.advisors.find(a => a.id === advisorId);
  if (!current || !advisor || advisor.area !== current.area) return { state, assignment: null };
  const replacement: Assignment = { ...current, id: crypto.randomUUID(), advisorId, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Excepción', observation: observation.trim() || undefined };
  state.assignments.push(replacement); saveRound(state); return { state, assignment: replacement };
}

export function nextAdvisor(area: RoundArea, state = loadRound()): Advisor | null {
  return state.queues[area].map(id => state.advisors.find(a => a.id === id)).find(a => a && !a.busy) || null;
}
