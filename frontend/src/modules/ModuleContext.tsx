import React, { createContext, useContext, useEffect, useState } from 'react';
import { getModules, ModuleKey, ModuleSettings } from '../api/client';

const defaults: ModuleSettings = { catalog: true, events: true, stadiums: true, parking: true, buses: true, assistant: true };

type ModuleContextValue = {
  modules: ModuleSettings;
  loading: boolean;
  setModules: (modules: ModuleSettings) => void;
  isEnabled: (key: ModuleKey) => boolean;
};

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<ModuleSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModules().then((response) => setModules(response.modules)).catch(() => setModules(defaults)).finally(() => setLoading(false));
  }, []);

  return <ModuleContext.Provider value={{ modules, loading, setModules, isEnabled: (key) => modules[key] }}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) throw new Error('useModules debe usarse dentro de ModuleProvider');
  return context;
}