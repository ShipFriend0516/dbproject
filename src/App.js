import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Components/LoginModal";
import MyPage from "./Pages/MyPage";
import ItemDetailPage from "./Pages/ItemDetailPage";
import CategoryPage from "./Pages/CategoryPage";
import ErrorPage from "./Pages/ErrorPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route key={"/"} path={"/"} element={<HomePage />}></Route>
        <Route key={"/login"} path={"/login"} element={<LoginPage />}></Route>
        <Route key={"/mypage"} path={"/mypage"} element={<MyPage />}></Route>
        <Route key={"/products/:id"} path={"/products/:id"} element={<ItemDetailPage />}></Route>
        <Route
          key={"/category/:categoryID"}
          path={"/category/:categoryID"}
          element={<CategoryPage />}
        ></Route>
        <Route key={"/error"} path={"/error"} element={<ErrorPage />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
