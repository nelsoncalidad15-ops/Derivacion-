import React from 'react';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react';
import { Opcion, Pregunta, Configuracion } from '../types';
import { formatPreguntaTexto } from '../services/flowEngine';

interface QuestionCardProps {
  pregunta: Pregunta;
  opciones: Opcion[];
  preguntaActualIndex: number;
  totalPreguntas: number;
  opcionSeleccionada?: Opcion;
  config: Configuracion;
  onSelectOption: (opcion: Opcion) => void;
  onBack: () => void;
  onReset: () => void;
  canGoBack: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  pregunta,
  opciones,
  preguntaActualIndex,
  totalPreguntas,
  opcionSeleccionada,
  config,
  onSelectOption,
  onBack,
  onReset,
  canGoBack,
}) => {
  const preguntaTextoFormateada = formatPreguntaTexto(pregunta, config);

  const progressPercent = Math.min(
    100,
    Math.round(((preguntaActualIndex + 1) / Math.max(totalPreguntas, 1)) * 100)
  );

  return (
    <div className="question-wrap w-full max-w-3xl mx-auto my-auto py-2">
      {/* Tablet Card */}
      <div className="question-card bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 relative">
        
        {/* Top Control Bar: Volver (Left) | Paso X de Y (Center) | Reiniciar (Right) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {canGoBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 min-h-[42px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          ) : (
            <div className="w-20" />
          )}

          <div className="px-3.5 py-1.5 rounded-full bg-blue-50 text-[#001e50] border border-blue-100 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            Orientación
          </div>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer active:scale-95 min-h-[42px]"
            title="Reiniciar cuestionario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>

        {/* Minimalist Progress Track */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#001e50] h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Heading */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2 leading-snug">
          {preguntaTextoFormateada}
        </h2>

        {pregunta.ayuda && (
          <p className="text-slate-500 text-xs sm:text-sm md:text-base mb-4 font-normal">
            {pregunta.ayuda}
          </p>
        )}

        {/* Tablet Optimized Options */}
        <div className="space-y-3 mt-4">
          {opciones.map((op) => {
            const isSelected = opcionSeleccionada?.opcion_id === op.opcion_id;

            return (
              <button
                key={op.opcion_id}
                onClick={() => onSelectOption(op)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99] min-h-[70px] ${
                  isSelected
                    ? 'bg-[#001e50] text-white border-[#001e50] shadow-md'
                    : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-900 hover:border-blue-400 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 pr-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-white bg-white text-[#001e50]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-[#001e50] stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-base sm:text-lg leading-snug block font-bold">
                      {op.texto}
                    </span>
                    {op.ayuda && (
                      <span className={`text-xs block mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                        {op.ayuda}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
