/**
 * Extract brand and category from product name
 * Uses fuzzy matching to find brand and category names within the product name
 * @param productName - The product name to extract from
 * @param brands - List of available brands
 * @param categories - Record of available categories
 * @returns Object with extracted brand and category, or null if no match
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  Top: [
    'blouse',
    'shirt',
    'tee',
    't-shirt',
    'tank',
    'bodysuit',
    'crop top',
    'cropped top',
    'vest',
    'sweater',
    'jumper',
  ],
  Bottom: ['pant', 'pants', 'trouser', 'jean', 'jeans', 'skirt', 'short', 'shorts'],
  Dress: ['dress', 'gown', 'maxi', 'midi', 'mini', 'romper', 'jumpsuit', 'kaftan', 'shift'],
  'Co-ords Set': ['set', 'co-ord', 'coord', 'two-piece', 'two piece', 'matching set'],
  Outerwear: [
    'jacket',
    'coat',
    'blazer',
    'parka',
    'duster',
    'anorak',
    'hoodie',
    'sweatshirt',
    'cardigan',
  ],
  Accessory: [
    'bag',
    'belt',
    'scarf',
    'hat',
    'cap',
    'glove',
    'gloves',
    'sunglass',
    'sunglasses',
    'jewelry',
    'jewellery',
    'necklace',
    'earring',
    'bracelet',
    'watch',
  ],
  Camisole: ['cami', 'camisole', 'sling', 'tank top'],
  Lingerie: [
    'lingerie',
    'bra',
    'brief',
    'briefs',
    'panty',
    'panties',
    'thong',
    'underwear',
    'bralette',
  ],
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findCategoryByKeyword = (
  normalizedName: string,
  categories: Record<string, string>,
): string | null => {
  const categoryKeys = Object.keys(categories).sort((a, b) => b.length - a.length);

  for (const categoryKey of categoryKeys) {
    const keyPattern = new RegExp(`\\b${escapeRegExp(categoryKey.toLowerCase())}\\b`);
    if (keyPattern.test(normalizedName)) {
      return categoryKey;
    }
  }

  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (!categories[category]) continue;

    for (const synonym of synonyms) {
      const pattern = new RegExp(`\\b${escapeRegExp(synonym.toLowerCase())}\\b`);
      if (pattern.test(normalizedName)) {
        return category;
      }
    }
  }

  return null;
};

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

  // Try to find category in product name using exact category labels or synonyms
  foundCategory = findCategoryByKeyword(normalizedName, categories);

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
