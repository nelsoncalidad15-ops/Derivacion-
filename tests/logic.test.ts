import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { evaluarDerivacion } from '../src/services/scoringEngine.ts';
import { obtenerSiguientePaso, type FlowStepId } from '../src/services/flowEngine.ts';
import { INITIAL_APP_DATA as data } from '../src/data/initialData.ts';
import type { Opcion } from '../src/types.ts';

const option = (id: string) => data.opciones.find(o => o.opcion_id === id)!;
test('Un usado de hasta 100.000 km no activa la regla de más de 100.000', () => {
  const result = evaluarDerivacion({ step_3b: option('o_step3b_hasta100'), step_2a: option('o_step2a_inmediato'), step_3a: option('o_step3a_dinero'), step_4a: option('o_step4a_rapido') }, data.preguntas, data.configuracion);
  assert.equal(result.canal, 'VENTA DIRECTA');
  assert.equal(evaluarDerivacion({ step_3b: option('o_step3b_mas100') }, data.preguntas, data.configuracion).canal, 'PLANES DE AHORRO');
});
test('La nueva frase conserva la preferencia por planes', () => {
  const result = evaluarDerivacion({ step_2a: option('o_step2a_meses'), step_3a: option('o_step3a_cuotas'), step_4a: option('o_step4a_cuota') }, data.preguntas, data.configuracion);
  assert.equal(result.canal, 'PLANES DE AHORRO');
});
test('Todas las rutas terminan sin ciclos y los empates permiten elección final', () => {
  let endings = 0;
  function walk(step: FlowStepId, answers: Record<string, Opcion>, depth: number) {
    assert.ok(depth < 12);
    const choices = data.opciones.filter(o => o.pregunta_id === step);
    assert.ok(choices.length);
    for (const choice of choices) {
      const nextAnswers = { ...answers, [step]: choice };
      const next = obtenerSiguientePaso(step, choice, nextAnswers);
      if (next.nextStepId && !next.isImmediateFinish) walk(next.nextStepId, nextAnswers, depth + 1);
      else {
        const result = evaluarDerivacion(nextAnswers, data.preguntas, data.configuracion, next.canalFinalDirecto);
        assert.ok(['VENTA DIRECTA', 'PLANES DE AHORRO', 'AMBAS ALTERNATIVAS'].includes(result.canal));
        endings++;
      }
    }
  }
  walk('step_1', {}, 0);
  assert.ok(endings > 100);
});

function backend() {
  const records: any[][] = [['Cliente', 'Tipo', 'Asesor', 'Ocupado', 'Fecha', 'ID', 'Estado', 'Asesor ID']];
  const props = new Map([['RONDA_ACTIVA', 'false']]);
  const validations: any[] = [];
  const tables: Record<string, any[][]> = {
    Derivaciones: records,
    Equipo: [['ID', 'Nombre', 'Tipo', 'Activo', 'Ocupado', 'Última asignación']],
    Movimientos: [['Fecha', 'Cliente', 'Tipo', 'Desde', 'Hacia', 'Motivo', 'ID']],
  };
  const book = { getId: () => '1aCByYYdl-2qpx4-ZFtLZty5GSGffnSS3URsAvO7gpc4', getSheetByName: (name: string): any => ({
    getName: () => name, getParent: () => book,
    getMaxRows: () => Math.max(1000, tables[name].length),
    insertRowsAfter() {},
    deleteRows: (row: number, count: number) => { tables[name].splice(row - 1, count); },
    getLastRow: () => tables[name].length, getLastColumn: () => tables[name][0].length,
    getRange: (row: number, col: number, count = 1, columns = 1) => ({
      getValues: () => tables[name].slice(row - 1, row - 1 + count).map(r => r.slice(col - 1, col - 1 + columns)),
      getFormulas: () => tables[name].slice(row - 1, row - 1 + count).map(r => r.slice(col - 1, col - 1 + columns).map(() => '')),
      setValues: (values: any[][]) => values.forEach((valuesRow, i) => valuesRow.forEach((value, j) => { tables[name][row - 1 + i] ??= []; tables[name][row - 1 + i][col - 1 + j] = value; })),
      setValue: (value: any) => { tables[name][row - 1][col - 1] = value; },
      clearDataValidations() {},
      setDataValidation: () => { validations.push({ name, row, col, count, columns }); },
      insertCheckboxes() {}, setNumberFormat() {},
    }),
    appendRow: (row: any[]) => tables[name].push([...row]),
  }) };
  let locked = false;
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => props.get(key), setProperty: (key: string, value: string) => props.set(key, value) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { assert.equal(locked, false); locked = true; return true; }, waitLock: () => { assert.equal(locked, false); locked = true; }, releaseLock: () => { locked = false; } }) },
    SpreadsheetApp: { openById: () => book, flush() {}, newDataValidation: () => ({
      requireCheckbox() { return this; }, requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return {}; },
    }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }) },
  });
  vm.runInContext(readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8'), context);
  return { context, records, tables, props, book, validations, send: (payload: any) => context.doPost({ postData: { contents: JSON.stringify(payload) } }) };
}

test('Las casillas vacías hasta la fila 1000 no desplazan nuevas derivaciones', () => {
  const { records, send } = backend();
  for (let i = 0; i < 999; i++) records.push(['', '', '', false, '', '', '', '']);
  const payload = { id: '11111111-1111-4111-8111-111111111111', tipo: 'Tradicional', fecha: new Date().toISOString() };
  assert.equal(send(payload).cliente, 'Cliente 1');
  assert.equal(records[1][5], payload.id);
  assert.equal(send({ ...payload, id: '22222222-2222-4222-8222-222222222222' }).cliente, 'Cliente 2');
  assert.equal(records[2][0], 'Cliente 2');
  assert.equal(records.length, 1000);
});

test('Ordenar conserva registros y equipo, quita huecos y limita casillas a filas con datos', () => {
  const { context, records, tables, validations, send, props } = backend();
  for (let i = 0; i < 999; i++) records.push(['', '', '', false, '', '', '', '']);
  const client = ['Cliente 66', 'Tradicional', 'Ana', false, new Date(), '11111111-1111-4111-8111-111111111111', 'Asignado', 'a'];
  records.push([...client]);
  tables.Equipo.push(['', '', '', false, false, ''], ['a', 'Ana', 'Tradicional', true, false, ''], ['', '', '', false, false, '']);
  props.set('CLIENTE_SECUENCIA', '66');
  context.ordenarFilasRegistro();
  assert.equal(records.length, 2);
  assert.deepEqual(records[1], client);
  assert.deepEqual(tables.Equipo[1], ['a', 'Ana', 'Tradicional', true, false, '']);
  assert.equal(tables.Equipo.length, 2);
  assert.ok(validations.every(v => v.row === 2 && v.count === 1));
  context.ordenarFilasRegistro();
  assert.equal(records.length, 2);
  const result = send({ id: '22222222-2222-4222-8222-222222222222', tipo: 'Planes', fecha: new Date().toISOString() });
  assert.equal(result.cliente, 'Cliente 67');
  assert.equal(records[2][0], 'Cliente 67');
});
test('Apps Script acepta registros sin clave, valida tipo y no duplica un reintento', () => {
  const { send, records } = backend();
  const payload = { id: '11111111-1111-4111-8111-111111111111', tipo: 'Tradicional', fecha: new Date().toISOString() };
  assert.equal(send(null).error, 'invalid');
  assert.equal(send({}).error, 'invalid');
  assert.equal(send({ ...payload, tipo: 'Mixto' }).error, 'invalid');
  assert.equal(records.length, 1);
  const first = send(payload);
  assert.equal(first.cliente, 'Cliente 1');
  assert.equal(first.asesor, '');
  assert.equal(first.estado, 'Solo área');
  assert.equal(records[1][6], 'Solo área');
  assert.deepEqual(send(payload), first);
  assert.equal(records.length, 2);
  assert.equal(send({ ...payload, id: '22222222-2222-4222-8222-222222222222', tipo: 'Planes' }).cliente, 'Cliente 2');
});
test('La ronda equilibra asignaciones, salta ocupados y respeta áreas', () => {
  const { context } = backend();
  const team = [['a', 'Ana', 'Tradicional', true, false, ''], ['b', 'Bruno', 'Tradicional', true, false, ''], ['p', 'Paz', 'Planes', true, false, '']];
  const registrations: any[] = [];
  for (let i = 0; i < 10; i++) {
    const chosen = context.chooseAdvisor_(team, registrations, 'Tradicional');
    registrations.push(['', 'Tradicional', chosen.name, false, '', '', 'Asignado', chosen.id]);
  }
  assert.equal(registrations.filter(r => r[7] === 'a').length, 5);
  assert.equal(registrations.filter(r => r[7] === 'b').length, 5);
  team[0][4] = true;
  assert.equal(context.chooseAdvisor_(team, registrations, 'Tradicional').id, 'b');
  team[1][4] = true;
  assert.equal(context.chooseAdvisor_(team, registrations, 'Tradicional'), null);
  team[0][4] = false;
  assert.equal(context.chooseAdvisor_(team, registrations, 'Tradicional').id, 'a');
  assert.equal(context.chooseAdvisor_(team, registrations, 'Planes').id, 'p');
});

test('La casilla reasigna, conserva historial y recupera pendientes al liberar un asesor', () => {
  const { context, tables, props, book, send, records } = backend();
  props.set('RONDA_ACTIVA', 'true');
  tables.Equipo.push(['a', 'Ana', 'Tradicional', true, false, ''], ['b', 'Bruno', 'Tradicional', true, false, '']);
  const payload = { id: '11111111-1111-4111-8111-111111111111', tipo: 'Tradicional', fecha: new Date().toISOString() };
  assert.equal(send(payload).asesor, 'Ana');
  const event = { range: { getSheet: () => book.getSheetByName('Derivaciones'), getColumn: () => 4, getRow: () => 2, getNumRows: () => 1, getNumColumns: () => 1 } };
  records[1][3] = true;
  context.alEditarRegistro(event);
  assert.equal(records[1][2], 'Bruno');
  assert.equal(tables.Equipo[1][4], true);
  assert.equal(records[1][3], false);
  assert.equal(tables.Movimientos.length, 2);
  context.alEditarRegistro(event); // Repeated delivery does not reassign twice.
  assert.equal(tables.Movimientos.length, 2);
  records[1][3] = true;
  context.alEditarRegistro(event);
  assert.equal(records[1][2], '');
  assert.equal(records[1][6], 'Sin asesor disponible');
  tables.Equipo[1][4] = false;
  context.asignarPendientes();
  assert.equal(records[1][2], 'Ana');
  assert.equal(records[1][6], 'Asignado');
  assert.equal(send(payload).asesor, 'Ana');
  assert.equal(records.length, 2);
});
