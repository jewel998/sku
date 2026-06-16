import { describe, expect, it } from 'vitest';
import { parseCsvText, normalizeCsvRows } from '../lib/csvUtils';

describe('csvUtils', () => {
  it('parses basic CSV rows including headers', () => {
    const raw = 'name,size,brand,category,locationId\n"Nike Air Zoom",M,Nike,Shoes,R1-S2-Right';
    const rows = parseCsvText(raw);

    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual(['name', 'size', 'brand', 'category', 'locationId']);
    expect(rows[1]).toEqual(['Nike Air Zoom', 'M', 'Nike', 'Shoes', 'R1-S2-Right']);
  });

  it('normalizes rows to label data and refreshes location from mapping', () => {
    const rows = [
      ['name', 'size', 'brand', 'category', 'locationId'],
      ['Nike Air Zoom', 'M', 'Nike', 'Shoes', 'R1-S2-Right'],
    ];

    const brands = ['Nike'];
    const categories = { Shoes: 'Shoes' };
    const mapping = { Nike: { Shoes: ['R1-S1-Left'] } };

    const labels = normalizeCsvRows(rows, brands, categories, mapping);

    expect(labels).toEqual([
      {
        name: 'Nike Air Zoom',
        size: 'M',
        brand: 'Nike',
        category: 'Shoes',
        locationId: 'R1-S1-Left',
      },
    ]);
  });

  it('uses extracted brand/category from the product name when available', () => {
    const rows = [
      ['Product Name', 'Size', 'Brand', 'Category', 'LocationId'],
      ['Nike Runner', 'L', '', '', 'R1-S2-Right'],
    ];
    const brands = ['Nike'];
    const categories = { Runner: 'Runner' };
    const mapping = { Nike: { Runner: ['R1-S3-Left'] } };

    const labels = normalizeCsvRows(rows, brands, categories, mapping);

    expect(labels[0]).toEqual({
      name: 'Nike Runner',
      size: 'L',
      brand: 'Nike',
      category: 'Runner',
      locationId: 'R1-S3-Left',
    });
  });

  it('maps blouse to Top category from product name', () => {
    const rows = [
      ['Product Name', 'Size', 'Brand', 'Category', 'LocationId'],
      ['Floral Blouse', 'M', '', '', ''],
    ];
    const brands = ['Anthropologie'];
    const categories = { Top: 'Top', Bottom: 'Bottom', Dress: 'Dress' };
    const mapping = {
      Anthropologie: { Top: ['R1-S1-Left'], Bottom: ['R2-S2-Right'], Dress: ['R1-S3-Left'] },
    };

    const labels = normalizeCsvRows(rows, brands, categories, mapping);

    expect(labels[0]).toEqual({
      name: 'Floral Blouse',
      size: 'M',
      brand: '',
      category: 'Top',
      locationId: '',
    });
  });

  it('extracts brand and category from name and fills location id', () => {
    const rows = [
      ['Product Name', 'Size', 'Brand', 'Category', 'LocationId'],
      ['Anthropologie Blouse', 'M', '', '', ''],
    ];
    const brands = ['Anthropologie'];
    const categories = { Top: 'Top', Bottom: 'Bottom', Dress: 'Dress' };
    const mapping = {
      Anthropologie: { Top: ['R1-S1-Left'], Bottom: ['R2-S2-Right'], Dress: ['R1-S3-Left'] },
    };

    const labels = normalizeCsvRows(rows, brands, categories, mapping);

    expect(labels[0]).toEqual({
      name: 'Anthropologie Blouse',
      size: 'M',
      brand: 'Anthropologie',
      category: 'Top',
      locationId: 'R1-S1-Left',
    });
  });
});
