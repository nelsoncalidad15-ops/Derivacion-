import React, { useState } from 'react';
import { MapPin, RefreshCw, UsersRound } from 'lucide-react';
import { Branch, loadRound, setActiveBranch } from '../services/roundService';

export const Navbar: React.FC<{ onReset: () => void; onRound: () => void }> = ({ onReset, onRound }) => {
  const [branch, setBranch] = useState<Branch>(() => loadRound().activeBranch);
  return <header className="site-header">
    <button onClick={onReset} className="brand-home" aria-label="Autosol · Ir al inicio">
      <img src={`${import.meta.env.BASE_URL}autosol-logo.png`} alt="Volkswagen Autosol" width="140" height="44" />
    </button>
    <div className="header-actions">
      <label className="header-branch"><MapPin size={14}/><span>Derivador</span><select aria-label="Sucursal del derivador" value={branch} onChange={e => { const next = e.target.value as Branch; setActiveBranch(next); setBranch(next); onReset(); }}><option value="Jujuy">Jujuy</option><option value="Salta">Salta</option></select></label>
      <button onClick={onRound} className="reset-button"><UsersRound size={15}/><span>Ver ronda</span></button>
      <button onClick={onReset} className="reset-button"><RefreshCw size={14} /><span>Nuevo cliente</span></button>
    </div>
  </header>;
};
