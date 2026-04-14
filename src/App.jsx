import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import MealPage from "./pages/MealPage";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import AllFoods from "./pages/AllFoods";
import Meals from "./pages/Meals";
import MyMeals from "./pages/MyMeals";
import Pantry from "./pages/Pantry";
import Profile from "./pages/Profile";
import FallingVegetablesBackground from "./components/FallingVegetablesBackground";
import AppFooter from "./components/AppFooter";
import FoodDetail from "./pages/FoodDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  // After email confirmation, Supabase redirects back with #type=signup in the hash.
  // Detect it on mount and send the user to the sign-in page.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "signup") {
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="app-root">
      {!isHome && <FallingVegetablesBackground />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/foods" element={<AllFoods />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/my-meals" element={<ProtectedRoute><MyMeals /></ProtectedRoute>} />
          <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/meal/:id" element={<MealPage />} />
          <Route path="/login" element={<Login redirectTo="/" />} />
          <Route path="/foods/:id" element={<FoodDetail />} />
        </Routes>
        {!isHome && <AppFooter />}
      </div>
    </div>
  );
}

export default App;