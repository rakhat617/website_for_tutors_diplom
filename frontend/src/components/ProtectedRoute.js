import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Если пользователь не авторизован — перенаправляем на логин
    return <Navigate to="/login" replace />;
  }

  // Если авторизован — рендерим дочерний компонент (например, ProfilePage)
  return children;
}
