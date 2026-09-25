import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, CanalDerivacion, Opcion, ResultadoDerivacion } from './types';
import { INITIAL_APP_DATA, INITIAL_PREGUNTAS, INITIAL_OPCIONES } from './data/initialData';
import { loadAppData } from './services/sheetsService';
import { evaluarDerivacion } from './services/scoringEngine';
import { FlowStepId, getProgresoEstimado, obtenerSiguientePaso } from './services/flowEngine';
import { CanalDefinitivo, flushRegistrations, queueRegistration, stopReceiptListener } from './services/registrationService';
import { Navbar } from './components/Navbar';
import { FastTrackCard } from './components/FastTrackCard';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { ChooseAreaCard } from './components/ChooseAreaCard';
import { RegistrationSetup } from './components/RegistrationSetup';
import { RoundPanel } from './components/RoundPanel';
import { assignNext } from './services/roundService';

export default function App() {
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [modoFlow, setModoFlow] = useState<'FAST_TRACK' | 'CUESTIONARIO' | 'ELEGIR_AREA' | 'RESULTADO'>('FAST_TRACK');
  const [currentStepId, setCurrentStepId] = useState<FlowStepId>('step_0');
  const [history, setHistory] = useState<FlowStepId[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Opcion>>({});
  const [resultado, setResultado] = useState<ResultadoDerivacion | null>(null);
  const [asesor, setAsesor] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(() => window.location.hash === '#configurar');
  const [showRound, setShowRound] = useState(() => window.location.hash === '#ronda');
  const [sinAsesor, setSinAsesor] = useState(false);
  const finalized = useRef(false);
  const visitId = useRef(crypto.randomUUID());
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleHash = () => { setIsConfiguring(window.location.hash === '#configurar'); setShowRound(window.location.hash === '#ronda'); };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    // Existing questionnaire configuration remains preconfigured, outside the client UI.
    try {
      const sheetId = localStorage.getItem('DERIVADOR_SHEET_ID');
      if (sheetId) void loadAppData(sheetId).then(setAppData);
    } catch { /* Base questions remain usable if local storage is unavailable. */ }
    void flushRegistrations();
    const interval = window.setInterval(() => void flushRegistrations(), 5000);
    const retry = () => void flushRegistrations();
    window.addEventListener('online', retry);
    return () => { clearInterval(interval); window.removeEventListener('online', retry); };
  }, []);

  useEffect(() => { main.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [modoFlow, currentStepId]);

  const handleResetSurvey = () => {
    stopReceiptListener(visitId.current);
    visitId.current = crypto.randomUUID();
    finalized.current = false;
    setRespuestas({}); setHistory([]); setCurrentStepId('step_0');
    setResultado(null); setAsesor(''); setSinAsesor(false); setModoFlow('FAST_TRACK');
  };

  const finish = (result: ResultadoDerivacion) => {
    if (finalized.current) return;
    setResultado(result);
    if (result.canal !== 'VENTA DIRECTA' && result.canal !== 'PLANES DE AHORRO') {
      setModoFlow('ELEGIR_AREA');
      return;
    }
    finalized.current = true;
    const id = visitId.current;
    const local = assignNext(id, result.canal);
    setAsesor(local?.advisorName || ''); setSinAsesor(!local);
    queueRegistration(id, result.canal, local ? { id: local.advisorId, name: local.advisorName } : undefined);
    setModoFlow('RESULTADO');
  };

  const startQuestionnaire = () => {
    setHistory(['step_0']); setCurrentStepId('step_1'); setModoFlow('CUESTIONARIO');
  };
  const handleFastTrackOption = (_opcion: Opcion, canal?: CanalDerivacion) => {
    if (canal === 'VENTA DIRECTA' || canal === 'PLANES DE AHORRO') finish(evaluarDerivacion({}, appData.preguntas, appData.configuracion, canal));
    else startQuestionnaire();
  };
  const preguntaFastTrack = appData.preguntas.find(p => p.id === 'step_0' || p.tipo === 'ACCESO_RAPIDO') || INITIAL_PREGUNTAS[0];
  const opcionesFastTrack = appData.opciones.filter(o => o.pregunta_id === preguntaFastTrack.id);
  const currentPregunta = appData.preguntas.find(p => p.id === currentStepId) || INITIAL_PREGUNTAS.find(p => p.id === currentStepId)!;
  const currentOpciones = useMemo(() => {
    const options = appData.opciones.filter(o => o.pregunta_id === currentStepId);
    return (options.length ? options : INITIAL_OPCIONES.filter(o => o.pregunta_id === currentStepId)).map(o =>
      o.opcion_id === 'o_step4a_cuota' ? { ...o, texto: 'Pagar en cuotas y esperar para retirar el vehículo', ayuda: 'Mi prioridad es una cuota acorde a mi presupuesto.' } : o);
  }, [appData.opciones, currentStepId]);
  const progreso = getProgresoEstimado(currentStepId);

  const handleSelectOptionInSurvey = (opcion: Opcion) => {
    const newRespuestas = { ...respuestas, [currentStepId]: opcion };
    setRespuestas(newRespuestas);
    const decision = obtenerSiguientePaso(currentStepId, opcion, newRespuestas);
    if (decision.nextStepId && !decision.isImmediateFinish) {
      setHistory(prev => [...prev, currentStepId]); setCurrentStepId(decision.nextStepId);
    } else finish(evaluarDerivacion(newRespuestas, appData.preguntas, appData.configuracion, decision.canalFinalDirecto));
  };
  const handleBackInSurvey = () => {
    const previousStep = history[history.length - 1] || 'step_0';
    const remainingHistory = history.slice(0, -1);
    setHistory(remainingHistory);
    // Drop discarded branches so an old used-car answer cannot affect a new route.
    setRespuestas(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => [...remainingHistory, previousStep].includes(id as FlowStepId))));
    setCurrentStepId(previousStep);
    setModoFlow(previousStep === 'step_0' ? 'FAST_TRACK' : 'CUESTIONARIO');
  };
  const chooseArea = (canal: CanalDefinitivo) => {
    if (resultado) finish({ ...resultado, canal });
  };

  if (isConfiguring) return <RegistrationSetup />;
  if (showRound) return <RoundPanel onClose={() => { window.location.hash = ''; setShowRound(false); }} />;
  return (
    <div className={`app-shell flex flex-col text-slate-900 antialiased ${modoFlow === 'FAST_TRACK' ? 'app-home' : ''}`}>
      <Navbar onReset={handleResetSurvey} onRound={() => { window.location.hash = 'ronda'; setShowRound(true); }} />
      <main ref={main} tabIndex={-1} className={`${modoFlow === 'FAST_TRACK' ? 'home-main' : 'flow-main'} outline-none`}>
        {modoFlow === 'FAST_TRACK' && <FastTrackCard pregunta={preguntaFastTrack} opciones={opcionesFastTrack} onSelectOption={handleFastTrackOption} onStartQuestionnaire={startQuestionnaire} />}
        {modoFlow === 'CUESTIONARIO' && currentPregunta && <QuestionCard pregunta={currentPregunta} opciones={currentOpciones} preguntaActualIndex={progreso.paso - 1} totalPreguntas={progreso.total} opcionSeleccionada={respuestas[currentStepId]} config={appData.configuracion} onSelectOption={handleSelectOptionInSurvey} onBack={handleBackInSurvey} onReset={handleResetSurvey} canGoBack />}
        {modoFlow === 'ELEGIR_AREA' && <ChooseAreaCard onSelect={chooseArea} onBack={() => setModoFlow('CUESTIONARIO')} />}
        {modoFlow === 'RESULTADO' && resultado && <ResultCard resultado={resultado} asesor={asesor} sinAsesor={sinAsesor} onNuevoIngreso={handleResetSurvey} />}
      </main>
      <footer className="site-footer"><span>Autosol · Concesionario Oficial Volkswagen</span><span>Jujuy · Recepción comercial</span></footer>
    </div>
  );
}
