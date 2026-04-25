import { useMemo, useState } from 'react';
import { parseLocationId } from '../lib/locationUtils';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Edit3,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type { AppConfig } from '../types/config';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

type SortBy = 'brand' | 'category' | 'location';
type SortOrder = 'asc' | 'desc';
type EditorMode = 'create' | 'edit';

interface ConfigItem {
  brand: string;
  category: string;
  locations: string[];
  parsedLocations: Array<{ rack: number; shelf: number; position: string } | null>;
}

interface EditorState {
  mode: EditorMode;
  original: ConfigItem | null;
  brand: string;
  category: string;
  locations: string[];
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function configKey(brand: string, category: string): string {
  return `${normalizeKey(brand)}::${normalizeKey(category)}`;
}

function formatPosition(position: string): string {
  return `${position.charAt(0).toUpperCase()}${position.slice(1).toLowerCase()}`;
}

function createEmptyEditor(): EditorState {
  return {
    mode: 'create',
    original: null,
    brand: '',
    category: '',
    locations: [''],
  };
}

function cloneMapping(mapping: AppConfig['mapping']): AppConfig['mapping'] {
  return Object.fromEntries(
    Object.entries(mapping).map(([brand, categoryMap]) => [
      brand,
      Object.fromEntries(
        Object.entries(categoryMap).map(([category, locations]) => [category, [...locations]]),
      ),
    ]),
  );
}

function removeMappingEntry(
  mapping: AppConfig['mapping'],
  brand: string,
  category: string,
): AppConfig['mapping'] {
  const nextMapping = cloneMapping(mapping);
  delete nextMapping[brand]?.[category];

  if (nextMapping[brand] && Object.keys(nextMapping[brand]).length === 0) {
    delete nextMapping[brand];
  }

  return nextMapping;
}

function buildConfigFromMapping(
  config: AppConfig,
  mapping: AppConfig['mapping'],
  categoryToKeep?: string,
): AppConfig {
  const categories = { ...config.categories };
  if (categoryToKeep && !categories[categoryToKeep]) {
    categories[categoryToKeep] = categoryToKeep;
  }

  return {
    brands: Object.keys(mapping).sort((a, b) => a.localeCompare(b)),
    categories,
    mapping,
  };
}

function findCaseInsensitive<T extends string>(items: T[], value: string): T | undefined {
  const normalizedValue = normalizeKey(value);
  return items.find((item) => normalizeKey(item) === normalizedValue);
}

export default function ConfigPage() {
  const auth = useAuth();
  const { config, source, isStale, error, replaceConfig } = useConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('brand');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const configData = useMemo(() => {
    const flattened: ConfigItem[] = [];

    Object.entries(config.mapping).forEach(([brand, categoryMap]) => {
      Object.entries(categoryMap).forEach(([category, locations]) => {
        flattened.push({
          brand,
          category,
          locations,
          parsedLocations: locations.map(parseLocationId),
        });
      });
    });

    return flattened;
  }, [config.mapping]);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();
    return configData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.brand.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.locations.some((loc) => loc.toLowerCase().includes(normalizedSearch));

      const matchesBrandFilter = !selectedBrand || item.brand === selectedBrand;
      const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;

      return matchesSearch && matchesBrandFilter && matchesCategoryFilter;
    });
  }, [configData, searchQuery, selectedBrand, selectedCategory]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'brand') {
        compareValue = a.brand.localeCompare(b.brand);
      } else if (sortBy === 'category') {
        compareValue = a.category.localeCompare(b.category);
      } else if (sortBy === 'location') {
        compareValue = (a.locations[0] ?? '').localeCompare(b.locations[0] ?? '');
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(configData.map((item) => item.brand));
    return Array.from(brands).sort();
  }, [configData]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set([
      ...Object.keys(config.categories),
      ...configData.map((item) => item.category),
    ]);
    return Array.from(categories).sort();
  }, [config.categories, configData]);

  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const toggleExpanded = (item: ConfigItem) => {
    const key = configKey(item.brand, item.category);
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const openCreateEditor = () => {
    setFormError(null);
    setEditor(createEmptyEditor());
  };

  const openEditEditor = (item: ConfigItem) => {
    setFormError(null);
    setEditor({
      mode: 'edit',
      original: item,
      brand: item.brand,
      category: item.category,
      locations: item.locations.length ? [...item.locations] : [''],
    });
  };

  const updateLocation = (index: number, value: string) => {
    setEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        locations: current.locations.map((location, locIndex) =>
          locIndex === index ? value : location,
        ),
      };
    });
  };

  const addLocation = () => {
    setEditor((current) =>
      current ? { ...current, locations: [...current.locations, ''] } : current,
    );
  };

  const removeLocation = (index: number) => {
    setEditor((current) => {
      if (!current) return current;
      const nextLocations = current.locations.filter((_location, locIndex) => locIndex !== index);
      return { ...current, locations: nextLocations.length ? nextLocations : [''] };
    });
  };

  const validateEditor = (current: EditorState): string | null => {
    const brand = current.brand.trim();
    const category = current.category.trim();
    const locations = current.locations.map((location) => location.trim()).filter(Boolean);

    if (!auth.isAdmin) return 'Only admin users can update configuration.';
    if (!brand) return 'Brand is required.';
    if (!category) return 'Category is required.';
    if (locations.length === 0) return 'Add at least one location.';

    const duplicateLocation = locations.find(
      (location, index) =>
        locations.findIndex((item) => normalizeKey(item) === normalizeKey(location)) !== index,
    );
    if (duplicateLocation) {
      return `Location "${duplicateLocation}" is repeated.`;
    }

    const nextKey = configKey(brand, category);
    const originalKey = current.original
      ? configKey(current.original.brand, current.original.category)
      : null;
    const duplicateConfig = configData.some(
      (item) => configKey(item.brand, item.category) === nextKey && nextKey !== originalKey,
    );

    if (duplicateConfig) {
      return 'This brand and category configuration already exists.';
    }

    return null;
  };

  const saveEditor = async () => {
    if (!editor) return;

    const validationMessage = validateEditor(editor);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const trimmedBrand = editor.brand.trim();
      const trimmedCategory = editor.category.trim();
      const locations = editor.locations.map((location) => location.trim()).filter(Boolean);
      const mappingWithoutOriginal =
        editor.mode === 'edit' && editor.original
          ? removeMappingEntry(config.mapping, editor.original.brand, editor.original.category)
          : cloneMapping(config.mapping);
      const existingBrand =
        findCaseInsensitive(Object.keys(mappingWithoutOriginal), trimmedBrand) ?? trimmedBrand;
      const existingCategory =
        findCaseInsensitive(Object.keys(config.categories), trimmedCategory) ?? trimmedCategory;

      const nextMapping = {
        ...mappingWithoutOriginal,
        [existingBrand]: {
          ...(mappingWithoutOriginal[existingBrand] ?? {}),
          [existingCategory]: locations,
        },
      };

      await replaceConfig(buildConfigFromMapping(config, nextMapping, existingCategory));
      setEditor(null);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Unable to save configuration.',
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (item: ConfigItem) => {
    if (!auth.isAdmin) return;

    const confirmed = window.confirm(`Delete ${item.brand} / ${item.category}?`);
    if (!confirmed) return;

    const nextMapping = removeMappingEntry(config.mapping, item.brand, item.category);
    await replaceConfig(buildConfigFromMapping(config, nextMapping));
  };

  const renderLocationCells = (location: string, parsed: ConfigItem['parsedLocations'][number]) => (
    <>
      <td className="px-4 py-3 text-sm text-slate-300 font-mono">{location}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{parsed ? `Rack ${parsed.rack}` : '-'}</td>
      <td className="px-4 py-3 text-sm text-slate-300">{parsed ? `Shelf ${parsed.shelf}` : '-'}</td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {parsed ? formatPosition(parsed.position) : '-'}
      </td>
    </>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Configuration</h1>
        </div>
        {auth.isAdmin ? (
          <button
            type="button"
            onClick={openCreateEditor}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Config
          </button>
        ) : (
          <div className="text-xs text-slate-400">Read-only. Admin access required to edit.</div>
        )}
      </div>
      <div className="mb-4 text-xs text-slate-400">
        Config source: {source}
        {isStale ? ' (sync pending)' : ''}
        {error ? ' - Firebase fallback active' : ''}
      </div>

      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 md:p-5 mb-6 space-y-4">
        <div>
          <label htmlFor="config-search" className="block text-sm font-medium text-slate-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="config-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, category, or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="config-brand-filter"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Brand
            </label>
            <select
              id="config-brand-filter"
              value={selectedBrand || ''}
              onChange={(e) => setSelectedBrand(e.target.value || null)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="">All Brands</option>
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="config-category-filter"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Category
            </label>
            <select
              id="config-category-filter"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 text-xs md:text-sm text-slate-400">
        Showing <span className="font-semibold text-slate-200">{sortedData.length}</span> results
        {(searchQuery || selectedBrand || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand(null);
              setSelectedCategory(null);
            }}
            className="ml-2 text-blue-400 hover:text-blue-300 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="hidden lg:block bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        {sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-600">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    <button
                      onClick={() => toggleSort('brand')}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                    >
                      Brand
                      {sortBy === 'brand' && <ArrowUpDown className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    <button
                      onClick={() => toggleSort('category')}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                    >
                      Category
                      {sortBy === 'category' && <ArrowUpDown className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Locations
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rack</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Shelf
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Section
                  </th>
                  {auth.isAdmin ? (
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-200">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedData.map((item) => {
                  const key = configKey(item.brand, item.category);
                  const expanded = expandedRows.has(key);
                  const firstParsed = item.parsedLocations[0];
                  return (
                    <>
                      <tr key={key} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-300"
                            title={expanded ? 'Collapse locations' : 'Expand locations'}
                          >
                            {expanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 font-medium">
                          {item.brand}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{item.category}</td>
                        {renderLocationCells(item.locations[0] ?? '-', firstParsed)}
                        {auth.isAdmin ? (
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditEditor(item)}
                                className="p-2 rounded hover:bg-slate-700 text-blue-300"
                                title="Edit configuration"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteConfig(item)}
                                className="p-2 rounded hover:bg-slate-700 text-red-300"
                                title="Delete configuration"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                      {expanded
                        ? item.locations.slice(1).map((location, index) => (
                            <tr key={`${key}-${location}`} className="bg-slate-900/40">
                              <td className="px-4 py-3" />
                              <td className="px-4 py-3 text-xs text-slate-500" />
                              <td className="px-4 py-3 text-xs text-slate-500" />
                              {renderLocationCells(location, item.parsedLocations[index + 1])}
                              {auth.isAdmin ? <td className="px-4 py-3" /> : null}
                            </tr>
                          ))
                        : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400">No configurations found matching your search.</p>
          </div>
        )}
      </div>

      <div className="lg:hidden space-y-4">
        {sortedData.length > 0 ? (
          sortedData.map((item) => {
            const key = configKey(item.brand, item.category);
            const expanded = expandedRows.has(key);
            return (
              <div key={key} className="bg-slate-800 border border-slate-600 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Brand</p>
                    <p className="text-slate-200 font-medium">{item.brand}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400 uppercase">Category</p>
                    <p className="text-slate-200">{item.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item)}
                    className="p-2 rounded hover:bg-slate-700 text-slate-300"
                    title={expanded ? 'Collapse locations' : 'Expand locations'}
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {(expanded ? item.locations : item.locations.slice(0, 1)).map(
                  (location, locIdx) => {
                    const parsed = item.parsedLocations[locIdx];
                    return (
                      <div key={location} className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">
                            Location ID
                          </p>
                          <p className="text-slate-300 font-mono text-sm">{location}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Rack</p>
                          <p className="text-slate-300">{parsed ? `Rack ${parsed.rack}` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Shelf</p>
                          <p className="text-slate-300">{parsed ? `Shelf ${parsed.shelf}` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">Section</p>
                          <p className="text-slate-300">
                            {parsed ? formatPosition(parsed.position) : '-'}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}
                {auth.isAdmin ? (
                  <div className="flex gap-2 pt-4 mt-4 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => openEditEditor(item)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteConfig(item)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 text-center">
            <p className="text-slate-400">No configurations found matching your search.</p>
          </div>
        )}
      </div>

      {editor ? (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setEditor(null)}
            aria-label="Close editor"
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl md:bottom-auto md:left-auto md:top-0 md:h-full md:max-h-none md:w-[440px] md:rounded-none md:border-y-0 md:border-r-0 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  {editor.mode === 'create' ? 'Add configuration' : 'Edit configuration'}
                </h2>
                <p className="text-xs text-slate-400">Brand and category must be unique.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="p-2 rounded hover:bg-slate-800 text-slate-300"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="config-brand"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Brand
                </label>
                <input
                  id="config-brand"
                  list="config-brand-options"
                  value={editor.brand}
                  onChange={(event) => setEditor({ ...editor, brand: event.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Brand"
                />
                <datalist id="config-brand-options">
                  {uniqueBrands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="config-category"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Category
                </label>
                <input
                  id="config-category"
                  list="config-category-options"
                  value={editor.category}
                  onChange={(event) => setEditor({ ...editor, category: event.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Category"
                />
                <datalist id="config-category-options">
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label
                    htmlFor="config-locations"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Locations
                  </label>
                  <button
                    type="button"
                    onClick={addLocation}
                    className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {editor.locations.map((location, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={location}
                        onChange={(event) => updateLocation(index, event.target.value)}
                        className="min-w-0 flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                        placeholder="R1-S1-Left"
                      />
                      <button
                        type="button"
                        onClick={() => removeLocation(index)}
                        className="shrink-0 p-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                        title="Remove location"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {formError ? (
                <div className="rounded-lg border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-200">
                  {formError}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveEditor()}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
