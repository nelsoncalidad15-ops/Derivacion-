import React, { useState } from 'react';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { ResultadoDerivacion } from '../types';
import { VwLogo } from './VwLogo';

interface ResultCardProps {
  resultado: ResultadoDerivacion;
  onNuevoIngreso: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  resultado,
  onNuevoIngreso,
}) => {
  const [showInternalScores, setShowInternalScores] = useState(false);
  const [copied, setCopied] = useState(false);

  const { canal, motivosPrincipales, puntosDirecta, puntosPlanes, diferencia } = resultado;

  const isDirecta = canal === 'VENTA DIRECTA';
  const isPlanes = canal === 'PLANES DE AHORRO';

  // Volkswagen Theming & Exact copy from flowchart
  const theme = isDirecta
    ? {
        bg: 'bg-[#001e50]',
        badge: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
        accentText: 'text-blue-300',
        title: 'VENTA DIRECTA',
        desc: 'Perfil de compra inmediata / financiación tradicional.',
      }
    : isPlanes
    ? {
        bg: 'bg-[#002f6c]',
        badge: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
        accentText: 'text-sky-300',
        title: 'PLANES DE AHORRO',
        desc: 'Perfil de compra programada / cuota accesible.',
      }
    : {
        bg: 'bg-[#0e213d]',
        badge: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/30',
        accentText: 'text-indigo-300',
        title: 'AMBAS ALTERNATIVAS',
        desc: 'Respuestas equilibradas. Requiere explicación de ambos canales.',
      };

  const handleCopySummary = () => {
    const text = `*Autosol VW | Derivación Comercial*\nResultado: *${theme.title}*\n${theme.desc}\n\n${
      motivosPrincipales?.map((m) => `• ${m.preguntaTexto}: ${m.opcionTexto}`).join('\n') || ''
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto py-2 px-3 sm:px-6">
      {/* Tablet Optimized Result Box */}
      <div
        className={`${theme.bg} rounded-3xl border border-white/20 p-6 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-blue-500/10 pointer-events-none blur-3xl" />
        <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 pointer-events-none blur-3xl" />

        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/20 mb-5 backdrop-blur-xs">
          <VwLogo className="w-4 h-4 text-white" inverted />
          <span>Canal de Atención Sugerido</span>
        </div>

        {/* Primary Result Headline */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 uppercase text-white drop-shadow-xs">
          {theme.title}
        </h1>

        {/* Description Subtitle */}
        <p className="text-base sm:text-xl font-medium text-slate-200 max-w-lg mx-auto leading-relaxed mb-6">
          {theme.desc}
        </p>

        {/* Motivos detectados (Clean summary) */}
        {motivosPrincipales && motivosPrincipales.length > 0 && (
          <div className="my-5 max-w-md mx-auto text-left bg-black/20 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block mb-2.5">
              Criterios de derivación
            </span>
            <div className="space-y-2">
              {motivosPrincipales.map((m, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-white">{m.preguntaTexto}:</strong>{' '}
                    {m.opcionTexto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Action Buttons (Large Touch Targets for Tablet) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={onNuevoIngreso}
            className="w-full sm:flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-base sm:text-lg font-black bg-white text-[#001e50] hover:bg-slate-100 transition-all cursor-pointer transform active:scale-95 shadow-lg min-h-[58px]"
          >
            <RefreshCw className="w-5 h-5" />
            <span>NUEVO CLIENTE</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-5 rounded-2xl text-sm font-bold bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer active:scale-95 shrink-0 min-h-[58px]"
            title="Copiar resultado"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Reception Manager Private Scoring Accordion (Hidden from client by default) */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowInternalScores(!showInternalScores)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-slate-200/50 cursor-pointer"
        >
          <span>{showInternalScores ? 'Ocultar datos de recepción' : 'Detalle técnico de recepción'}</span>
          {showInternalScores ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showInternalScores && (
          <div className="mt-3 p-4 bg-[#001e50] text-slate-200 rounded-2xl text-left text-xs font-mono max-w-md mx-auto space-y-2 border border-slate-700 shadow-inner">
            <div className="flex justify-between border-b border-slate-700 pb-1.5">
              <span className="text-slate-400">Puntos Venta Directa:</span>
              <span className="font-bold text-white">{puntosDirecta}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-1.5">
              <span className="text-slate-400">Puntos Planes de Ahorro:</span>
              <span className="font-bold text-white">{puntosPlanes}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-1.5">
              <span className="text-slate-400">Diferencia de Puntaje:</span>
              <span className="font-bold text-cyan-300">{diferencia}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Tipo de derivación:</span>
              <span className="font-bold text-slate-300">
                {resultado.esAccesoRapido ? 'Selección Directa (Fast Track)' : 'Evaluación Adaptativa'}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
