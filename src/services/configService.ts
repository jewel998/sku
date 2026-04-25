import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import staticConfig from '../data/config.json';
import type { AppConfig, CategoryKey, LocationId } from '../types/config';
import { LocalStorageRepository } from './storageRepository';

const CONFIG_COLLECTION = 'appConfig';
const CONFIG_DOCUMENT_ID = 'current';
const CONFIG_CACHE_KEY = 'sku.appConfig.cache.v1';
const CONFIG_PENDING_KEY = 'sku.appConfig.pending.v1';
const SCHEMA_VERSION = 1;

export type ConfigSource = 'firebase' | 'local-cache' | 'static';

export interface ConfigSnapshot {
  config: AppConfig;
  source: ConfigSource;
  syncedAt: string | null;
  isStale: boolean;
}

export interface ConfigServiceEvent extends ConfigSnapshot {
  error: Error | null;
}

interface StoredConfig {
  schemaVersion: number;
  config: AppConfig;
  syncedAt: string;
}

type ConfigListener = (event: ConfigServiceEvent) => void;

function sanitizeConfig(config: AppConfig): AppConfig {
  return {
    brands: [...new Set(config.brands)].sort((a, b) => a.localeCompare(b)),
    categories: { ...config.categories },
    mapping: { ...config.mapping },
  };
}

function createStaticSnapshot(): ConfigSnapshot {
  return {
    config: sanitizeConfig(staticConfig as AppConfig),
    source: 'static',
    syncedAt: null,
    isStale: true,
  };
}

function omitRecordKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([itemKey]) => itemKey !== key));
}

export class ConfigService {
  private listeners = new Set<ConfigListener>();
  private unsubscribe: Unsubscribe | null = null;
  private snapshot: ConfigSnapshot;
  private readonly cache = new LocalStorageRepository<StoredConfig>(CONFIG_CACHE_KEY);
  private readonly pending = new LocalStorageRepository<StoredConfig>(CONFIG_PENDING_KEY);

  constructor(private readonly db: Firestore | null) {
    const cached = this.cache.read();
    this.snapshot =
      cached?.schemaVersion === SCHEMA_VERSION
        ? {
            config: sanitizeConfig(cached.config),
            source: 'local-cache',
            syncedAt: cached.syncedAt,
            isStale: true,
          }
        : createStaticSnapshot();
  }

  getSnapshot(): ConfigSnapshot {
    return this.snapshot;
  }

  subscribe(listener: ConfigListener): Unsubscribe {
    this.listeners.add(listener);
    listener({ ...this.snapshot, error: null });

    if (this.db && !this.unsubscribe) {
      this.startFirestoreListener();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.unsubscribe?.();
        this.unsubscribe = null;
      }
    };
  }

  async replaceConfig(config: AppConfig): Promise<void> {
    await this.commitConfig(sanitizeConfig(config));
  }

  async createBrand(brand: string): Promise<void> {
    const nextBrand = brand.trim();
    if (!nextBrand) return;

    await this.commitConfig({
      ...this.snapshot.config,
      brands: [...new Set([...this.snapshot.config.brands, nextBrand])],
      mapping: {
        ...this.snapshot.config.mapping,
        [nextBrand]: this.snapshot.config.mapping[nextBrand] ?? {},
      },
    });
  }

  async deleteBrand(brand: string): Promise<void> {
    await this.commitConfig({
      ...this.snapshot.config,
      brands: this.snapshot.config.brands.filter((item) => item !== brand),
      mapping: omitRecordKey(this.snapshot.config.mapping, brand),
    });
  }

  async upsertCategory(category: CategoryKey, label = category): Promise<void> {
    const nextCategory = category.trim();
    if (!nextCategory) return;

    await this.commitConfig({
      ...this.snapshot.config,
      categories: {
        ...this.snapshot.config.categories,
        [nextCategory]: label.trim() || nextCategory,
      },
    });
  }

  async deleteCategory(category: CategoryKey): Promise<void> {
    const mapping = Object.fromEntries(
      Object.entries(this.snapshot.config.mapping).map(([brand, categoryMap]) => [
        brand,
        omitRecordKey(categoryMap, category),
      ]),
    );

    await this.commitConfig({
      ...this.snapshot.config,
      categories: omitRecordKey(this.snapshot.config.categories, category),
      mapping,
    });
  }

  async setLocations(brand: string, category: CategoryKey, locations: LocationId[]): Promise<void> {
    const nextBrand = brand.trim();
    const nextCategory = category.trim();
    if (!nextBrand || !nextCategory) return;

    await this.commitConfig({
      brands: [...new Set([...this.snapshot.config.brands, nextBrand])],
      categories: {
        ...this.snapshot.config.categories,
        [nextCategory]: this.snapshot.config.categories[nextCategory] ?? nextCategory,
      },
      mapping: {
        ...this.snapshot.config.mapping,
        [nextBrand]: {
          ...(this.snapshot.config.mapping[nextBrand] ?? {}),
          [nextCategory]: locations.map((location) => location.trim()).filter(Boolean),
        },
      },
    });
  }

  async deleteLocations(brand: string, category: CategoryKey): Promise<void> {
    const nextBrandMap = omitRecordKey(this.snapshot.config.mapping[brand] ?? {}, category);
    const nextMapping =
      Object.keys(nextBrandMap).length > 0
        ? {
            ...this.snapshot.config.mapping,
            [brand]: nextBrandMap,
          }
        : omitRecordKey(this.snapshot.config.mapping, brand);

    await this.commitConfig({
      ...this.snapshot.config,
      brands: this.snapshot.config.brands.filter(
        (item) =>
          item.toLowerCase() !== brand.toLowerCase() || Object.keys(nextBrandMap).length > 0,
      ),
      mapping: nextMapping,
    });
  }

  private startFirestoreListener(): void {
    if (!this.db) return;

    this.syncPendingConfig();
    this.unsubscribe = onSnapshot(
      doc(this.db, CONFIG_COLLECTION, CONFIG_DOCUMENT_ID),
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          void this.persistRemoteConfig(this.snapshot.config).catch((error) => {
            console.warn('Unable to seed missing Firebase config document', error);
          });
          return;
        }

        const data = docSnapshot.data();
        const nextConfig = sanitizeConfig({
          brands: Array.isArray(data.brands) ? data.brands : [],
          categories: typeof data.categories === 'object' ? data.categories : {},
          mapping: typeof data.mapping === 'object' ? data.mapping : {},
        } as AppConfig);

        this.setSnapshot({
          config: nextConfig,
          source: 'firebase',
          syncedAt: new Date().toISOString(),
          isStale: false,
        });
        this.cache.write({
          schemaVersion: SCHEMA_VERSION,
          config: nextConfig,
          syncedAt: this.snapshot.syncedAt ?? new Date().toISOString(),
        });
        this.pending.remove();
      },
      (error) => {
        console.warn('Firebase config listener failed, using fallback config', error);
        this.emit(error);
      },
    );
  }

  private async commitConfig(config: AppConfig): Promise<void> {
    const syncedAt = new Date().toISOString();
    this.setSnapshot({
      config,
      source: this.db ? 'local-cache' : this.snapshot.source,
      syncedAt,
      isStale: Boolean(this.db),
    });

    const storedConfig = { schemaVersion: SCHEMA_VERSION, config, syncedAt };
    this.cache.write(storedConfig);

    if (!this.db) {
      this.pending.write(storedConfig);
      return;
    }

    try {
      await this.persistRemoteConfig(config);
      this.pending.remove();
    } catch (error) {
      this.pending.write(storedConfig);
      this.emit(error instanceof Error ? error : new Error('Unable to save config'));
      throw error;
    }
  }

  private async syncPendingConfig(): Promise<void> {
    const pendingConfig = this.pending.read();
    if (!pendingConfig || pendingConfig.schemaVersion !== SCHEMA_VERSION) return;

    try {
      await this.persistRemoteConfig(pendingConfig.config);
      this.pending.remove();
    } catch (error) {
      console.warn('Pending config sync failed', error);
    }
  }

  private async persistRemoteConfig(config: AppConfig): Promise<void> {
    if (!this.db) return;

    await setDoc(
      doc(this.db, CONFIG_COLLECTION, CONFIG_DOCUMENT_ID),
      {
        schemaVersion: SCHEMA_VERSION,
        ...sanitizeConfig(config),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  private setSnapshot(snapshot: ConfigSnapshot): void {
    this.snapshot = snapshot;
    this.emit(null);
  }

  private emit(error: Error | null): void {
    const event = { ...this.snapshot, error };
    this.listeners.forEach((listener) => listener(event));
  }
}
