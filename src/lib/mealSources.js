import builtInMeals from "../data/meals";

export function mapBuiltInMeals() {
  return builtInMeals.map((meal) => ({
    ...meal,
    source: "built_in",
  }));
}

export function mapCustomMeals(customMeals) {
  return (customMeals || []).map((meal) => ({
    id: meal.id,
    title: meal.title,
    bestAgeRange: `${meal.min_age_months}-${meal.max_age_months} months`,
    minAgeMonths: meal.min_age_months,
    maxAgeMonths: meal.max_age_months,
    tags: ["custom"],
    mealType: "fancy",
    mealSlot: meal.meal_slot,
    ingredients: meal.ingredients || [],
    steps: meal.steps || "",
    nutritionHighlight: meal.nutrition_highlight || "Family custom meal.",
    source: "custom",
    customMealId: meal.id,
  }));
}

export function mergeMealSources(customMeals) {
  return [...mapBuiltInMeals(), ...mapCustomMeals(customMeals)];
}

