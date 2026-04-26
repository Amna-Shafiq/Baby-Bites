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
      Baby B
      <span style={{
        display: "inline-block",
        lineHeight: 1,
        transform: "rotate(-45deg)",
        margin: "0 -7px 0 -6px",
      }}>
        <svg viewBox="0 0 28 52" width="1.05em" height="1.05em" style={{ display: "block", overflow: "visible" }}>
          <defs>
            {/* Mask punches the bite hole out of the carrot body */}
            <mask id="bb-carrot-bite">
              <rect width="28" height="52" fill="white" />
              <ellipse cx="21" cy="21" rx="9" ry="8" fill="black" />
            </mask>
          </defs>

          {/* Green leaves */}
          <path d="M14,16 Q9,9 11,2 Q13,9 14,16"  fill="#56a83c" />
          <path d="M14,16 Q13,2 14,0 Q15,3 14,16"  fill="#3d8b2c" />
          <path d="M14,16 Q19,9 17,2 Q15,9 14,16"  fill="#56a83c" />

          {/* Orange carrot body — bite cut out via mask */}
          <path
            d="M9,16 Q7.5,33 13,50 Q14,52 15,50 Q20.5,33 19,16 Z"
            fill="#e87820"
            mask="url(#bb-carrot-bite)"
          />

          {/* Inner flesh arc at bite edge */}
          <path
            d="M13,20 Q16.5,22.5 18.5,18"
            stroke="#ffc87a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </span>
      tes
    </span>
  );
}

export default BrandLogo;
