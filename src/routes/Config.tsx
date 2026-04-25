import { useState, useMemo } from 'react';
import config from '../data/config';
import { parseLocationId } from '../lib/locationUtils';
import { Settings, Search, ArrowUpDown } from 'lucide-react';
import type { AppConfig } from '../types/config';

type ConfigMapping = AppConfig['mapping'];
type SortBy = 'brand' | 'category' | 'location';
type SortOrder = 'asc' | 'desc';

interface ConfigItem {
  brand: string;
  category: string;
  locations: string[];
  parsedLocations: Array<{ rack: number; shelf: number; position: string } | null>;
}

export default function ConfigPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('brand');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Flatten the config data for easier filtering and sorting
  const configData = useMemo(() => {
    const flattened: ConfigItem[] = [];

    const mapping = config.mapping as ConfigMapping;
    Object.entries(mapping).forEach(([brand, categoryMap]) => {
      Object.entries(categoryMap).forEach(([category, locations]) => {
        flattened.push({
          brand,
          category,
          locations: locations as string[],
          parsedLocations: (locations as string[]).map(parseLocationId),
        });
      });
    });

    return flattened;
  }, []);

  // Filter data based on search query and selected filters
  const filteredData = useMemo(() => {
    return configData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locations.some((loc) => loc.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBrandFilter = !selectedBrand || item.brand === selectedBrand;
      const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;

      return matchesSearch && matchesBrandFilter && matchesCategoryFilter;
    });
  }, [configData, searchQuery, selectedBrand, selectedCategory]);

  // Sort the filtered data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'brand') {
        compareValue = a.brand.localeCompare(b.brand);
      } else if (sortBy === 'category') {
        compareValue = a.category.localeCompare(b.category);
      } else if (sortBy === 'location') {
        compareValue = a.locations[0].localeCompare(b.locations[0]);
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [filteredData, sortBy, sortOrder]);

  // Get unique brands and categories for filter dropdowns
  const uniqueBrands = useMemo(() => {
    const brands = new Set(configData.map((item) => item.brand));
    return Array.from(brands).sort();
  }, [configData]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(configData.map((item) => item.category));
    return Array.from(categories).sort();
  }, [configData]);

  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Configuration</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 md:p-5 mb-6 space-y-4">
        {/* Search Input */}
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

        {/* Filter Section */}
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

      {/* Results Summary */}
      <div className="mb-4 text-xs md:text-sm text-slate-400">
        Showing <span className="font-semibold text-slate-200">{sortedData.length}</span> results
        {(searchQuery || selectedBrand || selectedCategory) && (
          <>
            {' '}
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
          </>
        )}
      </div>

      {/* Table Section - Desktop View */}
      <div className="hidden lg:block bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        {sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    <button
                      onClick={() => toggleSort('brand')}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                    >
                      Brand
                      {sortBy === 'brand' && (
                        <ArrowUpDown
                          className="w-4 h-4"
                          style={{ transform: `rotate(${sortOrder === 'desc' ? 180 : 0}deg)` }}
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    <button
                      onClick={() => toggleSort('category')}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                    >
                      Category
                      {sortBy === 'category' && (
                        <ArrowUpDown
                          className="w-4 h-4"
                          style={{ transform: `rotate(${sortOrder === 'desc' ? 180 : 0}deg)` }}
                        />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Rack</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Shelf
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedData.map((item, idx) =>
                  item.locations.map((_location, locIdx) => {
                    const parsed = item.parsedLocations[locIdx];
                    return (
                      <tr
                        key={`${idx}-${locIdx}`}
                        className="hover:bg-slate-700/50 transition-colors"
                      >
                        {locIdx === 0 && (
                          <>
                            <td
                              rowSpan={item.locations.length}
                              className="px-4 py-3 text-sm text-slate-300 font-medium"
                            >
                              {item.brand}
                            </td>
                            <td
                              rowSpan={item.locations.length}
                              className="px-4 py-3 text-sm text-slate-300"
                            >
                              {item.category}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {parsed ? `Rack ${parsed.rack}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {parsed ? `Shelf ${parsed.shelf}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {parsed
                            ? `${parsed.position.charAt(0).toUpperCase()}${parsed.position.slice(1).toLowerCase()}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400">No configurations found matching your search.</p>
          </div>
        )}
      </div>

      {/* Card View - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {sortedData.length > 0 ? (
          sortedData.map((item, idx) =>
            item.locations.map((location, locIdx) => {
              const parsed = item.parsedLocations[locIdx];
              return (
                <div
                  key={`${idx}-${locIdx}`}
                  className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-3"
                >
                  {locIdx === 0 && (
                    <>
                      <div className="border-b border-slate-700 pb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Brand</p>
                        <p className="text-slate-200 font-medium">{item.brand}</p>
                      </div>
                      <div className="border-b border-slate-700 pb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Category</p>
                        <p className="text-slate-200">{item.category}</p>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Location ID</p>
                      <p className="text-slate-300 font-mono text-sm">{location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Rack</p>
                      <p className="text-slate-300">{parsed ? `Rack ${parsed.rack}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Shelf</p>
                      <p className="text-slate-300">{parsed ? `Shelf ${parsed.shelf}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Section</p>
                      <p className="text-slate-300">
                        {parsed
                          ? `${parsed.position.charAt(0).toUpperCase()}${parsed.position.slice(1).toLowerCase()}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }),
          )
        ) : (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 text-center">
            <p className="text-slate-400">No configurations found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
