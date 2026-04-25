/**
 * Extract brand and category from product name
 * Uses fuzzy matching to find brand and category names within the product name
 * @param productName - The product name to extract from
 * @param brands - List of available brands
 * @param categories - Record of available categories
 * @returns Object with extracted brand and category, or null if no match
 */
export const extractBrandAndCategory = (
  productName: string,
  brands: string[],
  categories: Record<string, string>,
): { brand: string | null; category: string | null } => {
  const normalizedName = productName.toLowerCase().trim();

  let foundBrand: string | null = null;
  let foundCategory: string | null = null;

  // Try to find brand in product name (prioritize longer brand names to avoid partial matches)
  const sortedBrands = [...brands].sort((a, b) => b.length - a.length);
  for (const brand of sortedBrands) {
    if (normalizedName.includes(brand.toLowerCase())) {
      foundBrand = brand;
      break;
    }
  }

  // Try to find category in product name
  const categoryKeys = Object.keys(categories).sort((a, b) => b.length - a.length);
  for (const categoryKey of categoryKeys) {
    if (normalizedName.includes(categoryKey.toLowerCase())) {
      foundCategory = categoryKey;
      break;
    }
  }

  return { brand: foundBrand, category: foundCategory };
};

/**
 * Normalize brand name in product name to match config brand name
 * @param productName - The product name potentially containing a brand
 * @param extractedBrand - The extracted/matched brand from config
 * @returns Product name with normalized brand name
 */
export const normalizeBrandInProductName = (
  productName: string,
  extractedBrand: string,
): string => {
  if (!extractedBrand) return productName;

  const lowerProductName = productName.toLowerCase();
  const lowerBrand = extractedBrand.toLowerCase();

  // Find the position of the brand in the product name (case-insensitive)
  const index = lowerProductName.indexOf(lowerBrand);

  if (index === -1) return productName;

  // Replace the found brand (preserving the position) with the exact config brand name
  return (
    productName.substring(0, index) +
    extractedBrand +
    productName.substring(index + extractedBrand.length)
  );
};
