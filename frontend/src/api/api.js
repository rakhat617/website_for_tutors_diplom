import axiosInstance from "./axios";

// 👤 Регистрация
export const registerUser = async (data) => {
  const response = await axiosInstance.post("/auth/register/", data);
  return response.data;
};

// 🔐 Логин
export const loginUser = async (data) => {
  const response = await axiosInstance.post("/auth/login/", data);
  // Если логин успешен — сохраняем токены
  localStorage.setItem("access_token", response.data.access);
  localStorage.setItem("refresh_token", response.data.refresh);
  localStorage.setItem('user_id', response.data.user.id);
  localStorage.setItem('username', response.data.user.username);
  return response.data;
};

// 👤 Получить свой профиль
export const getProfile = async () => {
  const response = await axiosInstance.get("/profiles/me/");
  return response.data;
};

// 🚪 Выйти (удалить токены)
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

