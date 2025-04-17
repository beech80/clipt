/**
 * Utility functions to handle search operations safely
 */

/**
 * Returns a safe, non-undefined search term
 * @param searchTerm The original search term which might be undefined
 * @returns A string that is guaranteed not to be undefined
 */
export function getSafeSearchTerm(searchTerm: string | undefined | null): string {
  return searchTerm || '';
}

/**
 * Checks if a search term meets minimum search criteria
 * @param searchTerm The search term to validate
 * @param minLength Minimum required length (default: 2)
 * @returns Boolean indicating if search term is valid
 */
export function isValidSearchTerm(searchTerm: string | undefined | null, minLength: number = 2): boolean {
  const safeTerm = getSafeSearchTerm(searchTerm);
  return safeTerm.trim().length >= minLength;
}

/**
 * Safely filters an array by a search term
 * @param items Array of items to filter
 * @param searchTerm Search term to filter by
 * @param getSearchableText Function to extract searchable text from each item
 * @returns Filtered array of items
 */
export function filterBySearchTerm<T>(
  items: T[],
  searchTerm: string | undefined | null,
  getSearchableText: (item: T) => string
): T[] {
  const safeTerm = getSafeSearchTerm(searchTerm).toLowerCase().trim();
  
  if (!safeTerm) {
    return items;
  }
  
  return items.filter(item => {
    const searchableText = getSearchableText(item).toLowerCase();
    return searchableText.includes(safeTerm);
  });
}
