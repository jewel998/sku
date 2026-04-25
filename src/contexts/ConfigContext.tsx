import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppConfig, CategoryKey, LocationId } from '../types/config';
import {
  ConfigService,
  type ConfigServiceEvent,
  type ConfigSnapshot,
} from '../services/configService';
import { firebaseClient } from '../services/firebaseClient';

interface ConfigActions {
  replaceConfig: (config: AppConfig) => Promise<void>;
  createBrand: (brand: string) => Promise<void>;
  deleteBrand: (brand: string) => Promise<void>;
  upsertCategory: (category: CategoryKey, label?: string) => Promise<void>;
  deleteCategory: (category: CategoryKey) => Promise<void>;
  setLocations: (brand: string, category: CategoryKey, locations: LocationId[]) => Promise<void>;
  deleteLocations: (brand: string, category: CategoryKey) => Promise<void>;
}

interface ConfigContextValue extends ConfigSnapshot, ConfigActions {
  error: Error | null;
}

const services = firebaseClient.getServices();
const configService = new ConfigService(services?.db ?? null);

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<ConfigServiceEvent>(() => ({
    ...configService.getSnapshot(),
    error: null,
  }));

  useEffect(() => configService.subscribe(setEvent), []);

  const value = useMemo<ConfigContextValue>(
    () => ({
      ...event,
      replaceConfig: (config) => configService.replaceConfig(config),
      createBrand: (brand) => configService.createBrand(brand),
      deleteBrand: (brand) => configService.deleteBrand(brand),
      upsertCategory: (category, label) => configService.upsertCategory(category, label),
      deleteCategory: (category) => configService.deleteCategory(category),
      setLocations: (brand, category, locations) =>
        configService.setLocations(brand, category, locations),
      deleteLocations: (brand, category) => configService.deleteLocations(brand, category),
    }),
    [event],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}
