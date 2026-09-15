/** Autosol reception ledger. Bound to the private spreadsheet. */
const SHEET_ID = '1aCByYYdl-2qpx4-ZFtLZty5GSGffnSS3URsAvO7gpc4';
const SCHEMAS = {
  Derivaciones: ['Cliente', 'Tipo', 'Asesor', 'Reasignar: asesor ocupado', 'Fecha', 'ID', 'Estado', 'Asesor ID'],
  Equipo: ['ID', 'Nombre', 'Tipo', 'Activo', 'Ocupado', 'Última asignación'],
  Movimientos: ['Fecha', 'Cliente', 'Tipo', 'Desde', 'Hacia', 'Motivo', 'ID'],
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Autosol')
    .addItem('Preparar registro', 'prepararRegistro')
    .addItem('Ver clave de conexión', 'verClaveTablet')
    .addItem('Activar ronda', 'activarRonda')
    .addItem('Desactivar ronda', 'desactivarRonda')
    .addItem('Asignar pendientes', 'asignarPendientes')
    .addToUi();
}

function prepararRegistro() {
  const book = SpreadsheetApp.openById(SHEET_ID);
  Object.keys(SCHEMAS).forEach(name => {
    const sheet = book.getSheetByName(name) || book.insertSheet(name);
    const headers = SCHEMAS[name];
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    else if (JSON.stringify(sheet.getRange(1, 1, 1, headers.length).getValues()[0]) !== JSON.stringify(headers)) {
      throw new Error('La pestaña ' + name + ' ya contiene otra estructura. Renombrala antes de preparar el registro.');
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#001e50').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
  });
  const equipo = book.getSheetByName('Equipo');
  // Validation does not overwrite existing team availability or assignment data.
  equipo.getRange(2, 3, equipo.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Tradicional', 'Planes'], true).setAllowInvalid(false).build());
  equipo.getRange(2, 4, equipo.getMaxRows() - 1, 2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireCheckbox().build());
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TABLET_KEY')) props.setProperty('TABLET_KEY', Utilities.getUuid() + Utilities.getUuid());
  if (!props.getProperty('RONDA_ACTIVA')) props.setProperty('RONDA_ACTIVA', 'false');
  if (!book.getSheetByName('Resumen')) {
    const summary = book.insertSheet('Resumen');
    summary.getRange('A1').setFormula('=QUERY(Derivaciones!B2:B,"select B, count(B) where B is not null group by B label B \'Tipo\', count(B) \'Derivaciones\'",0)');
    summary.getRange('D1').setFormula('=QUERY(Derivaciones!A2:H,"select H, C, count(A) where H is not null group by H, C label H \'ID asesor\', C \'Asesor\', count(A) \'Asignaciones vigentes\'",0)');
    summary.getRange('H1').setValue('Las reasignaciones conservan el historial en Movimientos. Una atención cuenta solo para su asesor actual.');
  }
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'alEditarRegistro')) {
    ScriptApp.newTrigger('alEditarRegistro').forSpreadsheet(book).onEdit().create();
  }
  SpreadsheetApp.flush();
}

function verClaveTablet() {
  const key = PropertiesService.getScriptProperties().getProperty('TABLET_KEY');
  SpreadsheetApp.getUi().alert('Clave para configurar las tablets', key || 'Primero ejecutá Preparar registro.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function activarRonda() {
  PropertiesService.getScriptProperties().setProperty('RONDA_ACTIVA', 'true');
  asignarPendientes();
}
function desactivarRonda() { PropertiesService.getScriptProperties().setProperty('RONDA_ACTIVA', 'false'); }
function rondaActiva_() { return PropertiesService.getScriptProperties().getProperty('RONDA_ACTIVA') === 'true'; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function rows_(sheet) { return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : []; }
function receipt_(row) { return { ok: true, id: row[5], cliente: row[0], asesor: row[2] || '' }; }

function doPost(e) {
  let payload;
  try {
    if (!e || !e.postData || e.postData.contents.length > 2048) return json_({ ok: false, error: 'invalid' });
    payload = JSON.parse(e.postData.contents);
  } catch (_) { return json_({ ok: false, error: 'invalid' }); }
  const key = PropertiesService.getScriptProperties().getProperty('TABLET_KEY');
  if (!key || payload.key !== key) return json_({ ok: false, error: 'unauthorized' });
  if (!/^[a-f0-9-]{36}$/i.test(payload.id || '') || !['Tradicional', 'Planes'].includes(payload.tipo) ||
      typeof payload.fecha !== 'string' || !Number.isFinite(Date.parse(payload.fecha))) return json_({ ok: false, error: 'invalid' });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });
  try {
    const book = SpreadsheetApp.openById(SHEET_ID);
    const ledger = book.getSheetByName('Derivaciones');
    if (!ledger) return json_({ ok: false, error: 'not_configured' });
    const existing = rows_(ledger);
    const duplicate = existing.find(row => row[5] === payload.id);
    if (duplicate) return json_(receipt_(duplicate));
    const props = PropertiesService.getScriptProperties();
    const max = existing.reduce((n, row) => Math.max(n, Number(String(row[0]).replace('Cliente ', '')) || 0), Number(props.getProperty('CLIENTE_SECUENCIA')) || 0);
    const number = max + 1;
    // Reserve the number before append; gaps are safer than reusing a client number.
    props.setProperty('CLIENTE_SECUENCIA', String(number));
    const advisor = rondaActiva_() ? chooseAdvisor_(rows_(book.getSheetByName('Equipo')), existing, payload.tipo) : null;
    const row = ['Cliente ' + number, payload.tipo, advisor ? advisor.name : '', false, new Date(payload.fecha), payload.id,
      rondaActiva_() ? (advisor ? 'Asignado' : 'Sin asesor disponible') : 'Solo área', advisor ? advisor.id : ''];
    ledger.appendRow(row);
    const rowNumber = ledger.getLastRow();
    ledger.getRange(rowNumber, 4).insertCheckboxes();
    ledger.getRange(rowNumber, 5).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    if (advisor) book.getSheetByName('Equipo').getRange(advisor.row, 6).setValue(new Date());
    SpreadsheetApp.flush();
    return json_(receipt_(row));
  } catch (_) { return json_({ ok: false, error: 'server_error' }); }
  finally { lock.releaseLock(); }
}

/** Fewest current assignments first, then oldest assignment, then roster order. */
function chooseAdvisor_(team, registrations, tipo, excludedId) {
  const counts = {};
  registrations.forEach(row => { if (row[7]) counts[row[7]] = (counts[row[7]] || 0) + 1; });
  const ids = team.filter(row => row[0]).map(row => String(row[0]));
  if (new Set(ids).size !== ids.length) throw new Error('El equipo contiene IDs duplicados.');
  return team.map((row, i) => ({ id: String(row[0]), name: String(row[1]), tipo: row[2], active: row[3] === true,
    busy: row[4] === true, last: new Date(row[5] || 0).getTime() || 0, row: i + 2 }))
    .filter(person => person.id && person.name && person.tipo === tipo && person.active && !person.busy && person.id !== excludedId)
    .sort((a, b) => ((counts[a.id] || 0) - (counts[b.id] || 0)) || (a.last - b.last) || (a.row - b.row))[0] || null;
}

function alEditarRegistro(e) {
  if (!e || !e.range || !rondaActiva_()) return;
  const sheet = e.range.getSheet();
  if (sheet.getParent().getId() !== SHEET_ID) return;
  if (sheet.getName() === 'Equipo') { asignarPendientes(); return; }
  if (sheet.getName() !== 'Derivaciones' || e.range.getColumn() !== 4 || e.range.getRow() < 2 || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = sheet.getRange(e.range.getRow(), 1, 1, 8).getValues()[0];
    if (row[3] !== true) return;
    const book = sheet.getParent();
    const team = book.getSheetByName('Equipo');
    const oldId = row[7];
    const oldIndex = rows_(team).findIndex(person => String(person[0]) === oldId);
    if (oldIndex >= 0) team.getRange(oldIndex + 2, 5).setValue(true);
    const advisor = chooseAdvisor_(rows_(team), rows_(sheet), row[1], oldId);
    const oldName = row[2];
    row[2] = advisor ? advisor.name : '';
    row[3] = false;
    row[6] = advisor ? 'Asignado' : 'Sin asesor disponible';
    row[7] = advisor ? advisor.id : '';
    sheet.getRange(e.range.getRow(), 1, 1, 8).setValues([row]);
    if (advisor) team.getRange(advisor.row, 6).setValue(new Date());
    book.getSheetByName('Movimientos').appendRow([new Date(), row[0], row[1], oldName, row[2], 'Asesor ocupado', row[5]]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function asignarPendientes() {
  if (!rondaActiva_()) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.openById(SHEET_ID);
    const ledger = book.getSheetByName('Derivaciones');
    const team = book.getSheetByName('Equipo');
    const registrations = rows_(ledger);
    registrations.forEach((row, index) => {
      // Do not retroactively distribute visits recorded while the round was disabled.
      if (row[6] !== 'Sin asesor disponible') return;
      const advisor = chooseAdvisor_(rows_(team), registrations, row[1]);
      if (!advisor) return;
      row[2] = advisor.name; row[6] = 'Asignado'; row[7] = advisor.id; row[3] = false;
      ledger.getRange(index + 2, 1, 1, 8).setValues([row]);
      team.getRange(advisor.row, 6).setValue(new Date());
      book.getSheetByName('Movimientos').appendRow([new Date(), row[0], row[1], '', advisor.name, 'Asignación pendiente', row[5]]);
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}
