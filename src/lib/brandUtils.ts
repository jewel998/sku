/**
 * Find the matching brand from the brands list using case-insensitive comparison
 * @param input - The user input (may have different casing or whitespace)
 * @param brands - The list of valid brands
 * @returns The matched brand name or the original input if no match found
 */
export const findMatchingBrand = (input: string, brands: string[]): string => {
  if (!input.trim()) return input;

  const normalizedInput = input.trim().toLowerCase();

  // Try exact case-insensitive match
  const exactMatch = brands.find((brand) => brand.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;

  // Try partial match (starts with)
  const partialMatch = brands.find((brand) => brand.toLowerCase().startsWith(normalizedInput));
  if (partialMatch) return partialMatch;

  return input;
};

/**
 * Get filtered brands for dropdown suggestions based on user input
 * @param input - The user input
 * @param brands - The list of valid brands
 * @returns Array of matching brands (case-insensitive)
 */
export const getFilteredBrands = (input: string, brands: string[]): string[] => {
  if (!input.trim()) return brands;

  const normalizedInput = input.trim().toLowerCase();

  return brands.filter((brand) => brand.toLowerCase().includes(normalizedInput));
};

/**
 * Find the matching category key from the categories list using case-insensitive comparison
 * @param input - The user input (may have different casing or whitespace)
 * @param categories - The array of category keys
 * @returns The matched category key or the original input if no match found
 */
export const findMatchingCategory = (input: string, categories: string[]): string => {
  if (!input.trim()) return input;

  const normalizedInput = input.trim().toLowerCase();

  const exactMatch = categories.find((c) => c.toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;

  const partialMatch = categories.find((c) => c.toLowerCase().startsWith(normalizedInput));
  if (partialMatch) return partialMatch;

  return input;
};

export const getFilteredCategories = (input: string, categories: string[]): string[] => {
  if (!input.trim()) return categories;

  const normalizedInput = input.trim().toLowerCase();
  return categories.filter((c) => c.toLowerCase().includes(normalizedInput));
};
