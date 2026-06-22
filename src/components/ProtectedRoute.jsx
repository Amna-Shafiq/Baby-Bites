import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSession(user ?? null);
    });
  }, []);

  if (session === undefined) return null; // brief auth check, show nothing
  if (!session) {
    return <Navigate to="/login" state={{ redirectTo: location.pathname }} replace />;
  }
  return children;
}

export default ProtectedRoute;
