import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MealPage from "./pages/MealPage";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import AllFoods from "./pages/AllFoods";
import Meals from "./pages/Meals";
import MyMeals from "./pages/MyMeals";
import FallingVegetablesBackground from "./components/FallingVegetablesBackground";
import AppFooter from "./components/AppFooter";
import FoodDetail from "./pages/FoodDetail";

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="app-root">
      {!isHome && <FallingVegetablesBackground />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/foods" element={<AllFoods />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/my-meals" element={<MyMeals />} />
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