import React from 'react';
import { ArrowUpRight, Compass, CarFront, CalendarDays } from 'lucide-react';
import { Opcion, Pregunta, CanalDerivacion } from '../types';

interface FastTrackCardProps {
  pregunta: Pregunta;
  opciones: Opcion[];
  concesionarioNombre?: string;
  onSelectOption: (opcion: Opcion, canalDirecto?: CanalDerivacion) => void;
  onStartQuestionnaire: () => void;
}

export const FastTrackCard: React.FC<FastTrackCardProps> = ({ opciones, onSelectOption, onStartQuestionnaire }) => {
  const directOption = (channel: CanalDerivacion): Opcion => opciones.find(o => o.canal_directo === channel) || {
    pregunta_id: 'step_0', opcion_id: channel, texto: channel, ayuda: '',
    puntos_directa: 0, puntos_planes: 0, canal_directo: channel,
  };
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <span className="eyebrow"><span /> AUTOSOL · VOLKSWAGEN</span>
        <h1 id="welcome-title">Tu próximo Volkswagen.<br /><span>Empecemos por vos.</span></h1>
        <p>Elegí qué querés consultar.<br />Te orientamos hacia el equipo indicado.</p>
      </div>
      <div className="welcome-options">
        <span className="options-label">¿CÓMO TE PODEMOS AYUDAR?</span>
        <button className="route-card" onClick={() => onSelectOption(directOption('VENTA DIRECTA'), 'VENTA DIRECTA')}>
          <CarFront className="route-icon" size={25} strokeWidth={1.5} />
          <span><strong>Venta directa</strong><small>Contado, usado o financiación.</small></span>
          <ArrowUpRight className="route-arrow" size={23} />
        </button>
        <button className="route-card" onClick={() => onSelectOption(directOption('PLANES DE AHORRO'), 'PLANES DE AHORRO')}>
          <CalendarDays className="route-icon" size={25} strokeWidth={1.5} />
          <span><strong>Plan de ahorro</strong><small>Planificá la compra de tu 0 km.</small></span>
          <ArrowUpRight className="route-arrow" size={23} />
        </button>
        <button className="route-card route-guide" onClick={onStartQuestionnaire}>
          <Compass className="route-icon" size={25} strokeWidth={1.5} />
          <span><strong>Quiero orientación</strong><small>Encontrá tu opción en pocos pasos.</small></span>
          <ArrowUpRight className="route-arrow" size={23} />
        </button>
      </div>
    </section>
  );
};
