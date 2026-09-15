import React, { useState, useEffect, useMemo } from 'react';
import { AppData, CanalDerivacion, Opcion, ResultadoDerivacion } from './types';
import { INITIAL_APP_DATA, INITIAL_PREGUNTAS, INITIAL_OPCIONES } from './data/initialData';
import { loadAppData } from './services/sheetsService';
import { evaluarDerivacion } from './services/scoringEngine';
import { FlowStepId, getProgresoEstimado, obtenerSiguientePaso } from './services/flowEngine';
import { Navbar } from './components/Navbar';
import { FastTrackCard } from './components/FastTrackCard';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { ConfigSheetModal } from './components/ConfigSheetModal';

export default function App() {
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Survey Flow State
  const [modoFlow, setModoFlow] = useState<'FAST_TRACK' | 'CUESTIONARIO' | 'RESULTADO'>('FAST_TRACK');
  const [currentStepId, setCurrentStepId] = useState<FlowStepId>('step_0');
  const [history, setHistory] = useState<FlowStepId[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Opcion>>({});
  const [resultado, setResultado] = useState<ResultadoDerivacion | null>(null);

  // Load saved sheet ID from localStorage on mount
  useEffect(() => {
    const savedSheetId = localStorage.getItem('DERIVADOR_SHEET_ID');
    if (savedSheetId) {
      handleSyncSheet(savedSheetId);
    }
  }, []);

  // Sync Google Sheet Data
  const handleSyncSheet = async (sheetId: string) => {
    setIsLoadingSync(true);
    try {
      const data = await loadAppData(sheetId);
      setAppData(data);
      if (data.origenDatos === 'SHEETS' && sheetId) {
        localStorage.setItem('DERIVADOR_SHEET_ID', sheetId);
      }
    } catch (err) {
      console.error('Error syncing Google Sheet:', err);
    } finally {
      setIsLoadingSync(false);
    }
  };

  const handleRestoreDemoData = () => {
    localStorage.removeItem('DERIVADOR_SHEET_ID');
    setAppData(INITIAL_APP_DATA);
    handleResetSurvey();
  };

  // Reset entire flow for a new customer in 1 tap
  const handleResetSurvey = () => {
    setRespuestas({});
    setHistory([]);
    setCurrentStepId('step_0');
    setResultado(null);
    setModoFlow('FAST_TRACK');
  };

  // Fast-track initial question handler
  const handleFastTrackOption = (opcion: Opcion, canalDirecto?: CanalDerivacion) => {
    if (canalDirecto && (canalDirecto === 'VENTA DIRECTA' || canalDirecto === 'PLANES DE AHORRO')) {
      const res = evaluarDerivacion({}, appData.preguntas, appData.configuracion, canalDirecto);
      setResultado(res);
      setModoFlow('RESULTADO');
    } else {
      // User tapped "No sé / quiero orientación" -> start question 1
      setHistory(['step_0']);
      setCurrentStepId('step_1');
      setModoFlow('CUESTIONARIO');
    }
  };

  // Fast-track question & options
  const preguntaFastTrack = useMemo(() => {
    return (
      appData.preguntas.find((p) => p.id === 'step_0' || p.tipo === 'ACCESO_RAPIDO') ||
      INITIAL_PREGUNTAS[0]
    );
  }, [appData.preguntas]);

  const opcionesFastTrack = useMemo(() => {
    const ops = appData.opciones.filter(
      (o) => o.pregunta_id === 'step_0' || o.pregunta_id === preguntaFastTrack.id
    );
    if (ops.length > 0) return ops;
    return INITIAL_OPCIONES.filter((o) => o.pregunta_id === 'step_0');
  }, [appData.opciones, preguntaFastTrack]);

  // Current question in survey flow
  const currentPregunta = useMemo(() => {
    return (
      appData.preguntas.find((p) => p.id === currentStepId) ||
      INITIAL_PREGUNTAS.find((p) => p.id === currentStepId) ||
      appData.preguntas[0]
    );
  }, [appData.preguntas, currentStepId]);

  // Current options in survey flow
  const currentOpciones = useMemo(() => {
    const ops = appData.opciones.filter((o) => o.pregunta_id === currentStepId);
    if (ops.length > 0) return ops;
    return INITIAL_OPCIONES.filter((o) => o.pregunta_id === currentStepId);
  }, [appData.opciones, currentStepId]);

  // Progress estimation for progress bar and step badge
  const progreso = useMemo(() => {
    return getProgresoEstimado(currentStepId);
  }, [currentStepId]);

  // Option selection during questionnaire
  const handleSelectOptionInSurvey = (opcion: Opcion) => {
    const newRespuestas = {
      ...respuestas,
      [currentStepId]: opcion,
    };
    setRespuestas(newRespuestas);

    const decision = obtenerSiguientePaso(currentStepId, opcion, newRespuestas);

    if (decision.isImmediateFinish) {
      const res = evaluarDerivacion(
        newRespuestas,
        appData.preguntas,
        appData.configuracion,
        decision.canalFinalDirecto
      );
      setResultado(res);
      setModoFlow('RESULTADO');
    } else if (decision.nextStepId) {
      setHistory((prev) => [...prev, currentStepId]);
      setCurrentStepId(decision.nextStepId);
    } else {
      // Flow reached natural end
      const res = evaluarDerivacion(newRespuestas, appData.preguntas, appData.configuracion);
      setResultado(res);
      setModoFlow('RESULTADO');
    }
  };

  // Back button handler
  const handleBackInSurvey = () => {
    if (history.length > 0) {
      const previousStep = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      if (previousStep === 'step_0') {
        setModoFlow('FAST_TRACK');
        setCurrentStepId('step_0');
      } else {
        setCurrentStepId(previousStep);
      }
    } else {
      setModoFlow('FAST_TRACK');
      setCurrentStepId('step_0');
    }
  };

  return (
    <div className={`app-shell flex flex-col text-slate-900 antialiased ${modoFlow === 'FAST_TRACK' ? 'app-home' : ''}`}>
      {/* Top Reception Header (VW Style) */}
      <Navbar
        appData={appData}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onReset={handleResetSurvey}
      />

      {/* Main Tablet Canvas */}
      <main className={modoFlow === 'FAST_TRACK' ? 'home-main' : 'flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-4xl mx-auto'}>
        
        {/* Screen 1: Fast Track Initial Selection */}
        {modoFlow === 'FAST_TRACK' && (
          <FastTrackCard
            pregunta={preguntaFastTrack}
            opciones={opcionesFastTrack}
            concesionarioNombre={appData?.configuracion?.NOMBRE_CONCESIONARIO || 'Autosol'}
            onSelectOption={handleFastTrackOption}
            onStartQuestionnaire={() => {
              setHistory(['step_0']);
              setCurrentStepId('step_1');
              setModoFlow('CUESTIONARIO');
            }}
          />
        )}

        {/* Screen 2: Adaptive Step-by-Step Questionnaire */}
        {modoFlow === 'CUESTIONARIO' && currentPregunta && (
          <QuestionCard
            pregunta={currentPregunta}
            opciones={currentOpciones}
            preguntaActualIndex={progreso.paso - 1}
            totalPreguntas={progreso.total}
            opcionSeleccionada={respuestas[currentStepId]}
            config={appData.configuracion}
            onSelectOption={handleSelectOptionInSurvey}
            onBack={handleBackInSurvey}
            onReset={handleResetSurvey}
            canGoBack={true}
          />
        )}

        {/* Screen 3: Tablet Result Derivation */}
        {modoFlow === 'RESULTADO' && resultado && (
          <ResultCard
            resultado={resultado}
            onNuevoIngreso={handleResetSurvey}
          />
        )}

      </main>

      {/* Footer info (VW Minimal) */}
      <footer className="site-footer"><span>Autosol · Concesionario Oficial Volkswagen</span><span>Jujuy · Recepción comercial</span></footer>

      {/* Google Sheet Config Modal */}
      <ConfigSheetModal
        isOpen={isConfigModalOpen}
        appData={appData}
        config={appData?.configuracion}
        isLoadingSync={isLoadingSync}
        isLoading={isLoadingSync}
        origenDatos={appData?.origenDatos}
        errorSync={appData?.errorSync}
        onClose={() => setIsConfigModalOpen(false)}
        onSaveSheetId={async (sheetId) => {
          await handleSyncSheet(sheetId);
          setIsConfigModalOpen(false);
        }}
        onRestoreDemoData={handleRestoreDemoData}
      />
    </div>
  );
}
