import { useNavigate } from "react-router-dom";

function CTAFooter() {
  const navigate = useNavigate();

  return (
    <div className="cta-footer">
      <video
        className="cta-footer-video"
        src="https://res.cloudinary.com/dr0ixt3za/video/upload/v1776685676/eat4_bdzzp3.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="cta-footer-overlay" />
      <div className="cta-footer-content">
        <h2 className="cta-footer-heading">Start feeding with confidence today</h2>
        <p className="cta-footer-sub">
          Join parents using Baby Bites to take the guesswork out of every mealtime.
        </p>
        <button
          className="btn btn-primary cta-footer-btn"
          onClick={() => navigate("/login")}
        >
          Get started for free
        </button>
      </div>
    </div>
  );
}

export default CTAFooter;
