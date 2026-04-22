import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const ADMIN_EMAIL = "amna.shafiq.r@gmail.com";

function AdminRoute({ children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        navigate("/", { replace: true });
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;
  return children;
}

export default AdminRoute;
