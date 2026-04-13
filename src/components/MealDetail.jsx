function MealDetail({ meal, onBack }) {
  const title = meal?.title || "Untitled meal";
  const age = meal?.bestAgeRange || meal?.age || "Age not specified";
  const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients : [];
  const ingredientsText =
    ingredients.length > 0 ? ingredients.join(", ") : "No ingredients listed yet.";
  const steps = meal?.steps || "No preparation steps provided.";
  const nutrition =
    meal?.nutritionHighlight || "Nutrition details will be available soon.";

  return (
    <div className="page">
      <button onClick={onBack}>⬅ Back</button>

      <h2>{title}</h2>
      <p><strong>Best age range:</strong> {age}</p>

      <p><strong>Ingredients:</strong> {ingredientsText}</p>
      <p><strong>Steps:</strong> {steps}</p>
      <p><strong>Nutrition highlight:</strong> {nutrition}</p>
    </div>
  );
}

export default MealDetail;