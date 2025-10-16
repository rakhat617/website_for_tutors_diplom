import React, { useState } from "react";
import { registerUser } from "../api/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    role: "student",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      setMessage("✅ Регистрация прошла успешно! Проверьте почту для активации аккаунта.");
      setFormData({
        username: "",
        email: "",
        password: "",
        password2: "",
        role: "student",
      });
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при регистрации. Проверьте данные.");

      if (error.response && error.response.data) {
      const data = error.response.data;

      // Если backend вернул объект ошибок (обычно Django так делает)
      if (typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(", ")}`;
            } else if (typeof messages === "string") {
              return `${field}: ${messages}`;
            } else {
              return `${field}: ${JSON.stringify(messages)}`;
            }
          })
          .join("\n");
        setMessage(`❌ ${messages}`);
      } else {
        // Если backend вернул просто строку
        setMessage(`❌ ${data}`);
      }
    } else {
      setMessage("❌ Ошибка при регистрации. Проверьте интернет-соединение или попробуйте позже.");
    }
    }
  };

  return (
    <div style={styles.container}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password2"
          placeholder="Подтвердите пароль"
          value={formData.password2}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="student">Студент</option>
          <option value="tutor">Репетитор</option>
        </select>

        <button type="submit" style={styles.button}>Зарегистрироваться</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
