const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function mealSlug(meal) {
  const title = (meal.title || "meal")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${title}-${meal.id}`;
}

export function extractMealId(param) {
  const match = param.match(UUID_RE);
  return match ? match[0] : param;
}
