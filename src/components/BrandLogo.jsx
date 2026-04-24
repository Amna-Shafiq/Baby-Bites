function BrandLogo({ size = "1.2rem" }) {
  return (
    <span style={{
      fontFamily: "Aileron, sans-serif",
      fontWeight: 700,
      fontSize: size,
      color: "inherit",
      letterSpacing: "-0.01em",
      display: "inline-flex",
      alignItems: "center",
      gap: 0,
    }}>
      Baby B<span style={{ display: "inline-block", fontSize: "1.05em", lineHeight: 1, transform: "rotate(45deg)", margin: "0 -1px 0 0" }}>🥄</span>tes
    </span>
  );
}

export default BrandLogo;
