import React from 'react';
import { ArrowLeft, ArrowRight, CarFront, CalendarDays } from 'lucide-react';
import { CanalDefinitivo } from '../services/registrationService';

export function ChooseAreaCard({ onSelect, onBack }: { onSelect: (canal: CanalDefinitivo) => void; onBack: () => void }) {
  return <section className="question-card w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8">
    <button onClick={onBack} className="inline-flex items-center gap-2 min-h-11 text-sm text-slate-600 mb-4"><ArrowLeft size={17} /> Volver</button>
    <p className="text-xs text-slate-500 mb-2">Una última elección</p>
    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">¿Qué opción querés consultar primero?</h1>
    <p className="text-slate-500 mt-3 mb-6">Elegí el equipo con el que preferís empezar.</p>
    {[{ canal: 'VENTA DIRECTA' as const, title: 'Venta tradicional', detail: 'Comprar con una entrega, tu usado o financiación.', Icon: CarFront },
      { canal: 'PLANES DE AHORRO' as const, title: 'Planes de ahorro', detail: 'Conocer cómo planificar la compra mediante un plan.', Icon: CalendarDays }].map(({canal,title,detail,Icon}) =>
      <button key={canal} onClick={() => onSelect(canal)} className="flex w-full items-center gap-4 p-5 mt-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-left min-h-20">
        <Icon size={25} className="shrink-0 text-[#001e50]" /><span><strong className="block">{title}</strong><small className="block mt-1 text-slate-500">{detail}</small></span><ArrowRight size={20} className="ml-auto shrink-0" />
      </button>)}
  </section>;
}
