import { ChangeEvent } from 'react';
import { LabelData } from '../lib/pdfGenerator';
import { X, Hash } from 'lucide-react';

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

  const nameId = `name-${index}`;
  const sizeId = `size-${index}`;
  const brandId = `brand-${index}`;
  const categoryId = `category-${index}`;
  const locationId = `location-${index}`;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-300">
          <Hash className="w-5 h-5" />
          <span className="text-lg font-medium">Label #{index + 1}</span>
        </div>
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-700"
          onClick={() => onRemove(index)}
          title="Remove label"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <input
            id={nameId}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            type="text"
            value={page.name}
            onChange={handleInput('name')}
            placeholder="Product name (with color)"
          />
        </div>
        <div className="space-y-2">
          <input
            id={sizeId}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            type="text"
            value={page.size}
            onChange={handleInput('size')}
            placeholder="Size (e.g., M)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <select
            id={brandId}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            value={page.brand}
            onChange={handleInput('brand')}
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <select
            id={categoryId}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            value={page.category}
            onChange={handleInput('category')}
          >
            <option value="">Select category</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <input
          id={locationId}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          type="text"
          value={page.locationId}
          onChange={handleInput('locationId')}
          placeholder="Location ID (auto-filled)"
        />
      </div>
    </div>
  );
}
