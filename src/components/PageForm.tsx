import { ChangeEvent } from 'react';
import { LabelData } from '../lib/pdfGenerator';

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
    <div className="page-card">
      <div className="field-row" style={{ alignItems: 'end' }}>
        <div className="field-group">
          <label className="label" htmlFor={nameId}>
            Product Name (with color)
          </label>
          <input
            id={nameId}
            className="input"
            type="text"
            value={page.name}
            onChange={handleInput('name')}
            placeholder="Example: Orchid Tee (Lilac)"
          />
        </div>
        <div className="field-group">
          <label className="label" htmlFor={sizeId}>
            Size
          </label>
          <input
            id={sizeId}
            className="input"
            type="text"
            value={page.size}
            onChange={handleInput('size')}
            placeholder="Example: M"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="label" htmlFor={brandId}>
            Brand
          </label>
          <select
            id={brandId}
            className="select"
            value={page.brand}
            onChange={handleInput('brand')}
          >
            <option value="">Choose brand or type</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="label" htmlFor={categoryId}>
            Category
          </label>
          <select
            id={categoryId}
            className="select"
            value={page.category}
            onChange={handleInput('category')}
          >
            <option value="">Choose category</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label className="label" htmlFor={locationId}>
          Location ID
        </label>
        <input
          id={locationId}
          className="input"
          type="text"
          value={page.locationId}
          onChange={handleInput('locationId')}
          placeholder="Auto-filled when mapping is available"
        />
      </div>

      <div className="preview-toolbar">
        <div className="info-pill">Label #{index + 1}</div>
        <button type="button" className="button small-button" onClick={() => onRemove(index)}>
          Remove
        </button>
      </div>
    </div>
  );
}
