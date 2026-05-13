import { useState } from "react";

export default function StarRating({ avg, count, userRating, onRate, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  const filled = hovered || userRating || Math.round(avg || 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRate?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            style={{
              background: "none", border: "none", padding: "0 1px",
              cursor: readonly ? "default" : "pointer",
              fontSize: "1.2rem", lineHeight: 1,
              color: star <= filled ? "#F5A623" : "#D8D0C8",
              transition: "color 0.1s",
            }}
          >
            ★
          </button>
        ))}
      </div>

      {count > 0 ? (
        <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
          {avg} <span style={{ fontWeight: 400 }}>({count} {count === 1 ? "rating" : "ratings"})</span>
        </span>
      ) : !readonly ? (
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Be the first to rate</span>
      ) : null}
    </div>
  );
}
