/**
 * Lightweight CSV parsing and normalization helpers for the label builder.
 */
import type { AppConfig } from '../types/config';
import type { LabelData } from './pdfGenerator';
import { extractBrandAndCategory, normalizeBrandInProductName } from './productNameUtils';
import { findMatchingBrand, findMatchingCategory } from './brandUtils';

const normalizeField = (value: string): string => value.trim().replace(/\uFEFF/g, '');

export const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let idx = 0; idx < line.length; idx += 1) {
    const char = line[idx];

    if (char === '"') {
      const nextChar = line[idx + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        idx += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(normalizeField(current));
      current = '';
      continue;
    }

    current += char;
  }

  values.push(normalizeField(current));
  return values;
};

const isHeaderRow = (row: string[]): boolean => {
  const normalized = row.map((cell) => cell.toLowerCase());
  return [
    'name',
    'product',
    'product name',
    'size',
    'brand',
    'category',
    'location',
    'locationid',
    'location id',
  ].some((field) => normalized.includes(field));
};

export const parseCsvText = (text: string): string[][] => {
  if (!text.trim()) return [];

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
};

export const normalizeCsvRows = (
  rows: string[][],
  brands: string[],
  categories: Record<string, string>,
  mapping: AppConfig['mapping'],
): LabelData[] => {
  if (!rows.length) return [];

  let headerRow: string[] | null = null;
  let dataRows = rows;

  if (isHeaderRow(rows[0])) {
    headerRow = rows[0].map((col) => col.toLowerCase());
    dataRows = rows.slice(1);
  }

  return dataRows
    .map((row) => {
      const values = [...row];
      const getValue = (key: string, index: number) => {
        if (headerRow) {
          const headerIndex = headerRow.indexOf(key.toLowerCase());
          if (headerIndex !== -1) {
            return values[headerIndex] ?? '';
          }
        }
        return values[index] ?? '';
      };

      const name = normalizeField(getValue('name', 0));
      const size = normalizeField(getValue('size', 1));
      const rawBrand = normalizeField(getValue('brand', 2));
      const rawCategory = normalizeField(getValue('category', 3));
      const rawLocationId = normalizeField(getValue('locationId', 4) || getValue('location id', 4));

      if (!name) return null;

      const extracted = extractBrandAndCategory(name, brands, categories);
      const matchedBrand = extracted.brand || (rawBrand ? findMatchingBrand(rawBrand, brands) : '');
      const matchedCategory =
        extracted.category ||
        (rawCategory ? findMatchingCategory(rawCategory, Object.keys(categories)) : '');

      const normalizedName = extracted.brand
        ? normalizeBrandInProductName(name, extracted.brand)
        : name;

      const expectedLocationId =
        matchedBrand && matchedCategory && mapping[matchedBrand]?.[matchedCategory]
          ? (mapping[matchedBrand][matchedCategory][0] ?? '')
          : rawLocationId;

      return {
        name: normalizedName,
        size,
        brand: matchedBrand,
        category: matchedCategory,
        locationId: expectedLocationId,
      };
    })
    .filter((item): item is LabelData => Boolean(item));
};
