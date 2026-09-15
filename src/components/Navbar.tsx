import React from 'react';
import { RefreshCw } from 'lucide-react';

export const Navbar: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <header className="site-header">
    <button onClick={onReset} className="brand-home" aria-label="Autosol · Ir al inicio">
      <img src={`${import.meta.env.BASE_URL}autosol-logo.png`} alt="Volkswagen Autosol" width="140" height="44" />
    </button>
    <button onClick={onReset} className="reset-button"><RefreshCw size={14} /><span>Nuevo cliente</span></button>
  </header>
);
