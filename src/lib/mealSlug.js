const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function mealSlug(meal) {
  return (meal.title || "meal")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Returns UUID if the param is a legacy URL (pure UUID or slug+UUID), else null
export function extractLegacyId(param) {
  const match = param.match(UUID_RE);
  return match ? match[0] : null;
}

// Converts a clean slug back to a title search string
export function slugToTitleSearch(slug) {
  return slug.replace(/-/g, " ");
}
