import React, { useState, useEffect } from 'react';
import { Check, Copy, RefreshCw, Table, X, RotateCcw } from 'lucide-react';
import { AppData, Configuracion } from '../types';
import { DEFAULT_CONFIG } from '../data/initialData';

export interface ConfigSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData?: AppData;
  config?: Configuracion;
  onSaveSheetId: (sheetId: string) => Promise<void>;
  isLoading?: boolean;
  isLoadingSync?: boolean;
  errorSync?: string;
  origenDatos?: 'SHEETS' | 'DEMO';
  onRestoreDemoData?: () => void;
}

export const ConfigSheetModal: React.FC<ConfigSheetModalProps> = ({
  isOpen,
  onClose,
  appData,
  config,
  onSaveSheetId,
  isLoading,
  isLoadingSync,
  errorSync,
  origenDatos,
  onRestoreDemoData,
}) => {
  const currentConfig: Configuracion = config || appData?.configuracion || DEFAULT_CONFIG;
  const currentOrigen = origenDatos || appData?.origenDatos || 'DEMO';
  const isSyncing = isLoading ?? isLoadingSync ?? false;
  const currentError = errorSync || appData?.errorSync;

  const [sheetIdInput, setSheetIdInput] = useState<string>(currentConfig?.GOOGLE_SHEET_ID || '');
  const [activeTab, setActiveTab] = useState<'ID' | 'PLANTILLA' | 'INSTRUCCIONES'>('ID');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    if (currentConfig?.GOOGLE_SHEET_ID !== undefined) {
      setSheetIdInput(currentConfig.GOOGLE_SHEET_ID || '');
    }
  }, [currentConfig?.GOOGLE_SHEET_ID]);

  if (!isOpen) return null;

  const handleSave = async () => {
    let cleanId = sheetIdInput.trim();
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    }
    await onSaveSheetId(cleanId);
  };

  const copyData = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const tsvPreguntas = `ID\tORDEN\tPREGUNTA\tAYUDA\tTIPO\tCONDICION\tACTIVA
p_fast\t0\t¿Ya sabe qué modalidad quiere consultar?\tSi ya tiene decidido qué canal prefiere, puede derivar directamente al área correspondiente.\tACCESO_RAPIDO\t\tTRUE
p1\t1\t¿En qué momento le gustaría adquirir el vehículo?\tEl plazo estimado define la disponibilidad inmediata de stock o la programación de cuotas.\tSTANDARD\t\tTRUE
p2\t2\t¿Tiene actualmente un vehículo?\tPermite evaluar si interviene un vehículo en la operación.\tVEHICULO_GATEWAY\t\tTRUE
p3\t3\t¿Tiene pensado entregar su vehículo como parte de pago?\tDefine si se contempla la toma de su usado en la operación.\tSTANDARD\tTIENE_VEHICULO\tTRUE
p4\t4\t¿Cuántos kilómetros tiene aproximadamente su vehículo?\tVenta Directa recibe unidades de hasta 130.000 km como parte de pago.\tSTANDARD\tENTREGAR_USADO\tTRUE
p5\t5\t¿Cómo compró su vehículo anterior?\tModalidad utilizada en la compra de su vehículo previo.\tSTANDARD\t\tTRUE
p5_repetir\t6\t¿Le gustaría repetir la misma modalidad?\tDefine si prefiere continuar con la misma experiencia o probar la otra alternativa.\tSTANDARD\tCOMPRA_TRADICIONAL_O_PLAN\tTRUE
p6\t7\t¿Cómo tiene pensado afrontar la compra actualmente?\tEstructura de fondos y forma de pago contemplada.\tSTANDARD\t\tTRUE
p7\t8\t¿Qué alternativa se acerca más a lo que está buscando?\tObjetivo principal respecto a plazos y modalidad de compra.\tSTANDARD\t\tTRUE`;

  const tsvOpciones = `PREGUNTA_ID\tOPCION_ID\tTEXTO\tAYUDA\tPUNTOS_DIRECTA\tPUNTOS_PLANES
p_fast\to_fast_1\tVenta tradicional / financiación\tCompra convencional (contado, usado y/o crédito) para retiro en el corto plazo.\t0\t0
p_fast\to_fast_2\tPlan de Ahorro\tModalidad de ahorro previo en cuotas accesibles.\t0\t0
p_fast\to_fast_3\tNo sé / quiero orientación\tComienza el cuestionario para determinar la mejor opción para su perfil.\t0\t0
p1\to_p1_inmediato\tEste mes / lo antes posible\tInterés en retiro inmediato o en el corto plazo.\t4\t0
p1\to_p1_meses\tDentro de algunos meses / puedo esperar\tPlanificación anticipada a mediano plazo sin urgencia.\t0\t4
p1\to_p1_nose\tTodavía no lo sé\tEvaluando alternativas sin fecha definida.\t0\t0
p2\to_p2_si\tSí\tCuenta con un vehículo actualmente.\t0\t0
p2\to_p2_no\tNo\tNo dispone de vehículo propio en este momento.\t0\t0
p3\to_p3_si\tSí\tInterés en entregar el vehículo actual como parte de pago.\t0\t0
p3\to_p3_conservar\tNo, quiero conservarlo\tMantendrá la unidad o la venderá de forma particular.\t0\t0
p3\to_p3_nose\tTodavía no lo sé\tSin definición sobre la entrega del usado.\t0\t0
p4\to_p4_hasta100\tHasta 130.000 km\tVenta Directa recibe la unidad como parte de pago.\t4\t0
p4\to_p4_mas100\tMás de 130.000 km\tSupera el límite de toma para Venta Directa; orienta a Plan de Ahorro.\t0\t4
p4\to_p4_nose\tNo sabe\tKilometraje a verificar con el asesor comercial.\t0\t0
p5\to_p5_tradicional\tVenta tradicional\tCompra de contado, crédito prendario o entrega de usado en concesionario.\t1\t0
p5\to_p5_plan\tPlan de Ahorro\tAdquisición mediante cuotas de plan de ahorro previo.\t0\t1
p5\to_p5_usado\tCompró un usado\tCompra de vehículo usado a particular o en agencia.\t1\t0
p5\to_p5_nunca\tNunca compró un vehículo\tPrimera experiencia en la compra de un automóvil.\t0\t0
p5_repetir\to_p5_rep_si\tSí\tContinuar con el mismo canal de la compra anterior.\t0\t0
p5_repetir\to_p5_rep_no\tNo\tExplorar la modalidad comercial alternativa.\t0\t0
p6\to_p6_dinero\tTengo dinero para realizar una entrega ahora\tDisponibilidad de capital o anticipo inmediato para compra convencional.\t4\t0
p6\to_p6_vehiculo_financia\tEntrego mi vehículo y financio la diferencia\tEntrega de usado como parte de pago y financiación del saldo restante.\t4\t0
p6\to_p6_financia_pronto\tQuiero financiar una parte y retirar próximamente\tFinanciación prendaria directa con entrega de unidad en el corto plazo.\t4\t0
p6\to_p6_cuotas_entrega\tPrefiero comenzar pagando cuotas y realizar una entrega de capital más adelante\tAporte progresivo en cuotas accesibles con integración de capital a futuro.\t0\t4
p6\to_p6_nose\tTodavía no lo sé\tPara evaluar y comparar las alternativas comerciales.\t0\t0
p7\to_p7_rapido\tQuiero retirar un vehículo lo antes posible\tPrioridad máxima en tiempos de entrega rápidos.\t4\t0
p7\to_p7_esperar\tPuedo esperar y prefiero ir pagándolo progresivamente\tPrioridad en cuotas accesibles sin urgencia de entrega inmediata.\t0\t4
p7\to_p7_ambas\tQuiero conocer ambas alternativas\tDesea información comparativa tanto de Venta Directa como de Plan de Ahorro.\t0\t0`;

  const tsvConfig = `PARAMETRO\tVALOR
NOMBRE_CONCESIONARIO\tAutosol
UMBRAL_DIFERENCIA\t3
ANIO_CORTE_USADO\t2016
KM_CORTE_USADO\t130000`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xs">
              <Table className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                Conexión con Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Sincronización en tiempo real sin redeploy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('ID')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'ID'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vincular Hoja
          </button>
          <button
            onClick={() => setActiveTab('PLANTILLA')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'PLANTILLA'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Plantillas TSV (Copiar y Pegar)
          </button>
          <button
            onClick={() => setActiveTab('INSTRUCCIONES')}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'INSTRUCCIONES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guía Paso a Paso
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {activeTab === 'ID' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  ID o URL de la Hoja de Google Sheets
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="Ej: 1A2b3C4d5E6F... o https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSyncing}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Guardar y Sincronizar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Pegue el enlace completo del navegador o solo el ID alfanumérico.
                </p>
              </div>

              {currentError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
                  <p className="font-semibold mb-1">Error al sincronizar con Google Sheets:</p>
                  <p>{currentError}</p>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Origen de datos activo:</span>
                  <span
                    className={`font-semibold uppercase px-2 py-0.5 rounded-full ${
                      currentOrigen === 'SHEETS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {currentOrigen === 'SHEETS' ? 'Google Sheets Conectado' : 'Plantilla Local Predeterminada'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  <strong>Importante:</strong> La hoja de Google debe tener acceso público de lectura:
                  Haga clic en <em>Compartir</em> en Google Sheets y seleccione{' '}
                  <em>"Cualquier persona con el enlace puede ver"</em>.
                </p>

                {onRestoreDemoData && (
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => {
                        onRestoreDemoData();
                        setSheetIdInput('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      Restablecer plantilla inicial local
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'PLANTILLA' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Copie los datos formateados a continuación y péguelos directamente en la celda <strong>A1</strong> de cada pestaña de su Google Sheet.
              </p>

              {/* Tab 1: PREGUNTAS */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                    Pestaña 1: "PREGUNTAS"
                  </span>
                  <button
                    onClick={() => copyData('PREGUNTAS', tsvPreguntas)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedType === 'PREGUNTAS' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Tabla TSV
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-600 max-h-32">
                  {tsvPreguntas}
                </pre>
              </div>

              {/* Tab 2: OPCIONES */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                    Pestaña 2: "OPCIONES"
                  </span>
                  <button
                    onClick={() => copyData('OPCIONES', tsvOpciones)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedType === 'OPCIONES' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Tabla TSV
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-600 max-h-32">
                  {tsvOpciones}
                </pre>
              </div>

              {/* Tab 3: CONFIGURACION */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                    Pestaña 3: "CONFIGURACION"
                  </span>
                  <button
                    onClick={() => copyData('CONFIGURACION', tsvConfig)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedType === 'CONFIGURACION' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Tabla TSV
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-600 max-h-24">
                  {tsvConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'INSTRUCCIONES' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2 text-blue-900">
                <p className="font-semibold text-sm">Estructura requerida de la Hoja:</p>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-blue-800">
                  <li>
                    Cree una nueva hoja en Google Drive (ej: <em>Derivador Autosol VW</em>).
                  </li>
                  <li>
                    Cree exactamente tres pestañas con estos nombres exactos (en mayúsculas):
                    <strong> PREGUNTAS</strong>, <strong>OPCIONES</strong> y <strong>CONFIGURACION</strong>.
                  </li>
                  <li>
                    Copie los datos de la pestaña <strong>Plantillas TSV</strong> y péguelos en cada una a partir de la celda <strong>A1</strong>.
                  </li>
                  <li>
                    Haga clic en <strong>Compartir</strong> (arriba a la derecha) &gt; Acceso general: seleccione <strong>"Cualquier persona con el enlace"</strong> en rol <strong>Lector</strong>.
                  </li>
                  <li>
                    Copie la URL de la hoja y péguela en la pestaña <strong>Vincular Hoja</strong> de este derivador.
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                  Beneficios del Derivador Sincronizado
                </p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Modifique preguntas, textos de ayuda o sumatoria de puntos desde su celular o PC.</li>
                  <li>• Al presionar "Sincronizar", todos los recepcionistas y asesores ven los cambios al instante.</li>
                  <li>• Si la conexión a internet falla o el Sheet no responde, el sistema continúa operando con el respaldo local sin interrumpir la atención.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
