import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const ADMIN_EMAIL = "amna.shafiq.r@gmail.com";

function AdminRoute({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"

  useEffect(() => {
    // getUser() validates the JWT with Supabase's server — stronger than getSession()
    // which only reads from local storage without a network round-trip.
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user || user.email !== ADMIN_EMAIL) {
        setStatus("denied");
        navigate("/", { replace: true });
      } else {
        setStatus("allowed");
      }
    });
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "6rem" }}>
        <p className="muted">Verifying access…</p>
      </div>
    );
  }

  if (status === "denied") return null;

  return children;
}

export default AdminRoute;
