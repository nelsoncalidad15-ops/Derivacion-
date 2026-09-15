import React from 'react';
import { RefreshCw, Settings2 } from 'lucide-react';
import { AppData } from '../types';

interface NavbarProps { appData: AppData; onOpenConfig: () => void; onReset: () => void; }
export const Navbar: React.FC<NavbarProps> = ({ onOpenConfig, onReset }) => (
  <header className="site-header">
    <button onClick={onReset} className="brand-home" aria-label="Autosol · Ir al inicio">
      <img src={`${import.meta.env.BASE_URL}autosol-logo.png`} alt="Volkswagen Autosol" width="206" height="65" />
    </button>
    <div className="header-actions">
      <span className="reception-label">Recepción comercial</span>
      <button onClick={onOpenConfig} className="settings-button" aria-label="Configuración"><Settings2 size={19} /></button>
      <button onClick={onReset} className="reset-button"><RefreshCw size={15} /><span>Nuevo cliente</span></button>
    </div>
  </header>
);
