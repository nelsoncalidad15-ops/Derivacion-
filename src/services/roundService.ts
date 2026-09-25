import { CanalDefinitivo } from './registrationService';

export type RoundArea = 'Tradicional' | 'Planes';
export type Branch = 'Jujuy' | 'Salta';
export interface Advisor { id: string; name: string; area: RoundArea; branch: Branch; busy: boolean; }
export interface Assignment { id: string; visitId: string; area: RoundArea; branch: Branch; advisorId: string; advisorName: string; createdAt: string; status: 'Asignado' | 'Redirigido' | 'Excepción'; observation?: string; }
export interface RoundState { activeBranch: Branch; advisors: Advisor[]; queues: Record<Branch, Record<RoundArea, string[]>>; assignments: Assignment[]; }

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
  branch: 'Jujuy' as Branch,
  busy: false,
}));
const empty = (): RoundState => {
  const advisors = DEFAULT_ADVISORS.map(advisor => ({ ...advisor }));
  return {
    activeBranch: 'Jujuy',
    advisors,
    queues: {
      Jujuy: {
        Tradicional: advisors.filter(a => a.area === 'Tradicional').map(a => a.id),
        Planes: advisors.filter(a => a.area === 'Planes').map(a => a.id),
      },
      Salta: { Tradicional: [], Planes: [] },
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
  const activeBranch: Branch = state.activeBranch === 'Salta' ? 'Salta' : 'Jujuy';
  const advisors = state.advisors.filter(a => a.id && a.name && (a.area === 'Tradicional' || a.area === 'Planes'))
    .map(a => ({ ...a, branch: a.branch === 'Salta' ? 'Salta' as Branch : 'Jujuy' as Branch }));
  const queues: RoundState['queues'] = { Jujuy: { Tradicional: [], Planes: [] }, Salta: { Tradicional: [], Planes: [] } };
  (['Jujuy', 'Salta'] as Branch[]).forEach(branch => (['Tradicional', 'Planes'] as RoundArea[]).forEach(area => {
    const valid = new Set(advisors.filter(a => a.branch === branch && a.area === area).map(a => a.id));
    const legacy = (state.queues as unknown as Record<RoundArea, string[]>)[area];
    const savedSource = state.queues?.[branch]?.[area] || (branch === 'Jujuy' ? legacy : []) || [];
    const saved = savedSource.filter((id, i, all) => valid.has(id) && all.indexOf(id) === i);
    queues[branch][area] = [...saved, ...[...valid].filter(id => !saved.includes(id))];
  }));
  const assignments = (state.assignments || []).slice(-100).map(a => ({ ...a, branch: a.branch === 'Salta' ? 'Salta' as Branch : 'Jujuy' as Branch }));
  return { activeBranch, advisors, queues, assignments };
}

export function saveRound(state: RoundState) {
  localStorage.setItem(KEY, JSON.stringify(normalize(state)));
  window.dispatchEvent(new Event('autosol-round-change'));
}

export function setActiveBranch(branch: Branch): RoundState {
  const state = loadRound(); state.activeBranch = branch; saveRound(state); return state;
}

export function addAdvisor(name: string, area: RoundArea): RoundState {
  const state = loadRound();
  const advisor: Advisor = { id: crypto.randomUUID(), name: name.trim(), area, branch: state.activeBranch, busy: false };
  state.advisors.push(advisor); state.queues[state.activeBranch][area].push(advisor.id); saveRound(state); return state;
}

export function updateAdvisor(id: string, changes: Partial<Pick<Advisor, 'name' | 'busy'>>): RoundState {
  const state = loadRound();
  state.advisors = state.advisors.map(a => a.id === id ? { ...a, ...changes, name: changes.name?.trim() || a.name } : a);
  saveRound(state); return state;
}

export function removeAdvisor(id: string): RoundState {
  const state = loadRound(); state.advisors = state.advisors.filter(a => a.id !== id);
  (['Jujuy', 'Salta'] as Branch[]).forEach(branch => (['Tradicional', 'Planes'] as RoundArea[]).forEach(area => { state.queues[branch][area] = state.queues[branch][area].filter(x => x !== id); }));
  saveRound(state); return state;
}

export function moveAdvisor(id: string, targetId: string): RoundState {
  const state = loadRound(); const advisor = state.advisors.find(a => a.id === id); const target = state.advisors.find(a => a.id === targetId);
  if (!advisor || !target || advisor.branch !== target.branch || advisor.area !== target.area || id === targetId) return state;
  const queue = state.queues[advisor.branch][advisor.area]; const from = queue.indexOf(id); const to = queue.indexOf(targetId);
  if (from < 0 || to < 0) return state;
  queue.splice(from, 1); queue.splice(to, 0, id); saveRound(state); return state;
}

export function nudgeAdvisor(id: string, direction: -1 | 1): RoundState {
  const state = loadRound(); const advisor = state.advisors.find(a => a.id === id); if (!advisor) return state;
  const queue = state.queues[advisor.branch][advisor.area]; const index = queue.indexOf(id); const target = index + direction;
  if (index < 0 || target < 0 || target >= queue.length) return state;
  [queue[index], queue[target]] = [queue[target], queue[index]]; saveRound(state); return state;
}

/** The first available person is served. Skipped busy people keep priority. */
export function assignNext(visitId: string, channel: CanalDefinitivo): Assignment | null {
  const state = loadRound(); const area = areaFor(channel); const branch = state.activeBranch; const queue = state.queues[branch][area];
  const index = queue.findIndex(id => !state.advisors.find(a => a.id === id)?.busy);
  if (index < 0) return null;
  const [id] = queue.splice(index, 1); queue.push(id);
  const advisor = state.advisors.find(a => a.id === id)!;
  const assignment: Assignment = { id: crypto.randomUUID(), visitId, area, branch, advisorId: id, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Asignado' };
  state.assignments.push(assignment); saveRound(state); return assignment;
}

export function reassignBusy(assignmentId: string, observation = ''): { state: RoundState; assignment: Assignment | null } {
  const state = loadRound(); const current = state.assignments.find(a => a.id === assignmentId);
  if (!current) return { state, assignment: null };
  const old = state.advisors.find(a => a.id === current.advisorId); if (old) old.busy = true;
  state.queues[current.branch][current.area] = [current.advisorId, ...state.queues[current.branch][current.area].filter(id => id !== current.advisorId)];
  const index = state.queues[current.branch][current.area].findIndex(id => !state.advisors.find(a => a.id === id)?.busy);
  if (index < 0) { saveRound(state); return { state, assignment: null }; }
  const [id] = state.queues[current.branch][current.area].splice(index, 1); state.queues[current.branch][current.area].push(id);
  const advisor = state.advisors.find(a => a.id === id)!;
  const replacement: Assignment = { ...current, id: crypto.randomUUID(), advisorId: id, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Redirigido', observation: observation.trim() || undefined };
  state.assignments.push(replacement); saveRound(state); return { state, assignment: replacement };
}

/** A manager override intentionally leaves the normal queue untouched. */
export function overrideAssignment(assignmentId: string, advisorId: string, observation = ''): { state: RoundState; assignment: Assignment | null } {
  const state = loadRound(); const current = state.assignments.find(a => a.id === assignmentId); const advisor = state.advisors.find(a => a.id === advisorId);
  if (!current || !advisor || advisor.area !== current.area || advisor.branch !== current.branch) return { state, assignment: null };
  const replacement: Assignment = { ...current, id: crypto.randomUUID(), advisorId, advisorName: advisor.name, createdAt: new Date().toISOString(), status: 'Excepción', observation: observation.trim() || undefined };
  state.assignments.push(replacement); saveRound(state); return { state, assignment: replacement };
}

export function nextAdvisor(area: RoundArea, state = loadRound()): Advisor | null {
  return state.queues[state.activeBranch][area].map(id => state.advisors.find(a => a.id === id)).find(a => a && !a.busy) || null;
}
