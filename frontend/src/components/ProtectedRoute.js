import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Пока идёт проверка токена — показываем спиннер или просто текст
  if (loading) return <p>Загрузка...</p>;

  // Если не авторизован — редирект на логин
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Если авторизован — рендерим дочерний компонент
  return children;
}
