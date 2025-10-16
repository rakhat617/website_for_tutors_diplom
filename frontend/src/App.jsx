import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import TutorProfile from "./pages/TutorProfile";

function App() {
  return (
    <Router>
      <Header />
      <main className="container" style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/activate/:code" element={<ActivateAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/tutors/:id" element={<TutorProfile />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
