import { useMemo, ChangeEvent } from 'react';
import { LabelData } from '../lib/pdfGenerator';
import { X, Hash } from 'lucide-react';
import {
  findMatchingBrand,
  getFilteredBrands,
  findMatchingCategory,
  getFilteredCategories,
} from '../lib/brandUtils';
import { extractBrandAndCategory, normalizeBrandInProductName } from '../lib/productNameUtils';
import config from '../data/config';

interface PageFormProps {
  index: number;
  page: LabelData;
  brands: string[];
  categories: Record<string, string>;
  onChange: (index: number, next: LabelData) => void;
  onRemove: (index: number) => void;
}

export default function PageForm({
  index,
  page,
  brands,
  categories,
  onChange,
  onRemove,
}: PageFormProps) {
  const handleInput =
    (field: keyof LabelData) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(index, { ...page, [field]: event.target.value });
    };

  // Specialized handlers for brand/category to clear locationId on edit
  const handleBrandInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(index, { ...page, brand: event.target.value, locationId: '' });
  };

  const handleCategoryInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(index, { ...page, category: event.target.value, locationId: '' });
  };

  // Filter brands based on current input for case-insensitive suggestions
  const filteredBrands = useMemo(() => getFilteredBrands(page.brand, brands), [page.brand, brands]);

  // Handle brand blur to auto-select matching brand and attempt to update location
  const handleBrandBlur = () => {
    const matchedBrand = findMatchingBrand(page.brand, brands);
    const updated = { ...page, brand: matchedBrand };

    // If category already exists and both match config, set locationId
    const matchedCategory = findMatchingCategory(
      updated.category || '',
      Object.keys(config.categories),
    );
    if (matchedCategory && updated.brand && config.mapping[matchedBrand]?.[matchedCategory]) {
      updated.locationId = config.mapping[matchedBrand][matchedCategory][0] ?? '';
      updated.category = matchedCategory;
    }

    if (
      updated.brand !== page.brand ||
      updated.category !== page.category ||
      updated.locationId !== page.locationId
    ) {
      onChange(index, updated);
    }
  };

  // Handle category blur to auto-select matching category and attempt to update location
  const handleCategoryBlur = () => {
    const matchedCategory = findMatchingCategory(
      page.category || '',
      Object.keys(config.categories),
    );
    const updated = { ...page, category: matchedCategory };

    const matchedBrand = findMatchingBrand(updated.brand || '', brands);
    if (matchedBrand && matchedCategory && config.mapping[matchedBrand]?.[matchedCategory]) {
      updated.locationId = config.mapping[matchedBrand][matchedCategory][0] ?? '';
      updated.brand = matchedBrand;
    }

    if (
      updated.brand !== page.brand ||
      updated.category !== page.category ||
      updated.locationId !== page.locationId
    ) {
      onChange(index, updated);
    }
  };

  // Handle product name blur to extract brand and category
  const handleNameBlur = () => {
    if (!page.name.trim()) return;

    const { brand: extractedBrand, category: extractedCategory } = extractBrandAndCategory(
      page.name,
      brands,
      categories,
    );

    const updatedPage = { ...page };

    // Auto-fill brand if extracted and not already set
    if (extractedBrand && !page.brand) {
      updatedPage.brand = extractedBrand;
    }

    // Auto-fill category if extracted and not already set
    if (extractedCategory && !page.category) {
      updatedPage.category = extractedCategory;
    }

    // Normalize brand name in product name if brand was found
    if (extractedBrand) {
      updatedPage.name = normalizeBrandInProductName(page.name, extractedBrand);
    }

    // If both brand and category are available and mapping exists, set locationId
    if (
      updatedPage.brand &&
      updatedPage.category &&
      config.mapping[updatedPage.brand]?.[updatedPage.category]
    ) {
      updatedPage.locationId = config.mapping[updatedPage.brand][updatedPage.category][0] ?? '';
    }

    // Only update if something changed
    if (
      updatedPage.brand !== page.brand ||
      updatedPage.category !== page.category ||
      updatedPage.name !== page.name
    ) {
      onChange(index, updatedPage);
    }
  };

  const nameId = `name-${index}`;
  const sizeId = `size-${index}`;
  const brandId = `brand-${index}`;
  const categoryId = `category-${index}`;
  const locationId = `location-${index}`;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 text-slate-300">
          <Hash className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-base md:text-lg font-medium">Label #{index + 1}</span>
        </div>
        <button
          type="button"
          className="p-1 md:p-2 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-700"
          onClick={() => onRemove(index)}
          title="Remove label"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <input
            id={nameId}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            type="text"
            value={page.name}
            onChange={handleInput('name')}
            onBlur={handleNameBlur}
            placeholder="Product name (with color)"
          />
        </div>
        <div className="space-y-2">
          <input
            id={sizeId}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            type="text"
            value={page.size}
            onChange={handleInput('size')}
            placeholder="Size (e.g., M)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <input
            id={brandId}
            list={`brand-list-${index}`}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            type="text"
            value={page.brand}
            onChange={handleBrandInput}
            onBlur={handleBrandBlur}
            placeholder="Brand"
            aria-label="Brand"
          />
          <datalist id={`brand-list-${index}`}>
            {filteredBrands.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <input
            id={categoryId}
            list={`category-list-${index}`}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            type="text"
            value={page.category}
            onChange={handleCategoryInput}
            onBlur={handleCategoryBlur}
            placeholder="Category"
            aria-label="Category"
          />
          <datalist id={`category-list-${index}`}>
            {getFilteredCategories(page.category, Object.keys(categories)).map((key) => (
              <option key={key} value={key} label={categories[key]} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <input
          id={locationId}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          type="text"
          value={page.locationId}
          onChange={handleInput('locationId')}
          placeholder="Location ID (auto-filled)"
        />
      </div>
    </div>
  );
}
