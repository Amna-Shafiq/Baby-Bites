import { useNavigate } from "react-router-dom";

function CTAFooter() {
  const navigate = useNavigate();

  return (
    <div className="cta-footer">
      <div className="cta-footer-inner">
        <div className="cta-footer-text">
          <p className="cta-footer-eyebrow">Ready to start?</p>
          <h2 className="cta-footer-heading">Start feeding with confidence today</h2>
          <p className="cta-footer-sub">
            Join parents using Baby Bites to take the guesswork out of every mealtime.
          </p>
          <button className="cta-footer-btn" onClick={() => navigate("/login")}>
            Get started for free
          </button>
        </div>

        <div className="cta-footer-video-wrap">
          <video
            className="cta-footer-video"
            src="https://pub-fa59902d9c914df3be6d8860cdc82704.r2.dev/babybites-assets/5135468-uhd_3840_2160_25fps.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>
    </div>
  );
}

export default CTAFooter;
