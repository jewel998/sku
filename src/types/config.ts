export type BrandName = string;
export type CategoryKey = string;
export type LocationId = string;

export type ConfigMapping = Record<BrandName, Record<CategoryKey, LocationId[]>>;

export interface AppConfig {
  brands: BrandName[];
  categories: Record<CategoryKey, string>;
  mapping: ConfigMapping;
}
