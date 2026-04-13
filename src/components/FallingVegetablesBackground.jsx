import { useMemo } from "react";

const EMOJIS = ["🥕", "🥔", "🧅", "🥦", "🍊", "🍉"];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function FallingVegetablesBackground() {
  const items = useMemo(() => {
    // Keep it small so it doesn't hurt performance.
    const count = 26;
    return Array.from({ length: count }).map((_, idx) => {
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const left = randomBetween(0, 100);
      const size = randomBetween(10, 21);
      const duration = randomBetween(6, 14);
      const delay = -randomBetween(0, duration); // start at different points in animation
      const drift = randomBetween(-40, 40);

      return {
        key: `veg-${idx}`,
        emoji,
        left,
        size,
        duration,
        delay,
        drift,
      };
    });
  }, []);

  return (
    <div className="falling-bg" aria-hidden="true">
      {items.map((item) => (
        <div
          key={item.key}
          className="fall-item"
          style={{
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            // Custom property used by CSS keyframes for horizontal drift.
            ["--drift"]: `${item.drift}px`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}

export default FallingVegetablesBackground;

