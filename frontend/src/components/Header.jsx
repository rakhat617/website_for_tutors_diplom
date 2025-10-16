import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <h2>🎓 Diplom Project</h2>
      <nav>
        <Link to="/" style={styles.link}>Главная</Link>

        {!isAuthenticated ? (
          <>
            <Link to="/login" style={styles.link}>Вход</Link>
            <Link to="/register" style={styles.link}>Регистрация</Link>
          </>
        ) : (
          <>
            <Link to="/profile" style={styles.link}>Профиль</Link>
            <button onClick={handleLogout} style={styles.logoutButton}>Выйти</button>
          </>
        )}
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    backgroundColor: "#f0f0f0",
  },
  link: {
    margin: "0 10px",
    textDecoration: "none",
    color: "#007bff",
  },
  logoutButton: {
    margin: "0 10px",
    padding: "5px 10px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
