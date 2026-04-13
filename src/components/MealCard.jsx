function MealCard({ meal, onClick, isFavorite, onFavorite }) {
  const ageText = meal?.bestAgeRange || meal?.age || "Age not specified";

  return (
    <div
      onClick={() => onClick(meal)}
      className="card card-clickable"
      style={{ margin: "10px 0" }}
    >
      <h3>{meal.title}</h3>
      <p>{ageText}</p>
      <button
        type="button"
        className="btn btn-icon"
        onClick={(e) => {
          e.stopPropagation(); // prevents triggering card click
          onFavorite && onFavorite();
        }}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? "❤️" : "🤍"}
      </button>
    </div>
  );
}

export default MealCard;