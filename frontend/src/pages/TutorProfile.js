import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function TutorProfile() {
  const { id } = useParams();
  const [tutor, setTutor] = useState(null);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const response = await axiosInstance.get(`/profiles/${id}/`);
        setTutor(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchTutor();
  }, [id]);

  if (!tutor) {
    return <p style={{ textAlign: "center" }}>Загрузка...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{tutor.username}</h2>
        <p><strong>Email:</strong> {tutor.email}</p>
        <p><strong>Роль:</strong> {tutor.role === "tutor" ? "Репетитор" : "Студент"}</p>
        <p><strong>Описание:</strong> {tutor.bio || "—"}</p>
        <p>
          <strong>Предметы:</strong>{" "}
          {tutor.subjects && tutor.subjects.length > 0
            ? tutor.subjects.map((s) => s.name).join(", ")
            : "—"}
        </p>
        <p>
          <strong>Цена за час:</strong>{" "}
          {tutor.price_per_hour ? `${tutor.price_per_hour}₸` : "Не указана"}
        </p>
        <p><strong>⭐ Рейтинг:</strong> {tutor.rating?.toFixed(1) || "0.0"}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
};
