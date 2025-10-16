import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function TutorList() {
  const [tutors, setTutors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await axiosInstance.get("/profiles/tutors/");
        setTutors(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке репетиторов:", error);
      }
    };
    fetchTutors();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎓 Найди своего репетитора</h2>
      <div style={styles.grid}>
        {tutors.length > 0 ? (
          tutors.map((tutor) => (
            <div
              key={tutor.id}
              style={styles.card}
              onClick={() => navigate(`/tutors/${tutor.id}`)}
            >
              <h3 style={styles.username}>{tutor.username}</h3>
              <p style={styles.bio}>
                {tutor.bio ? tutor.bio : "Описание отсутствует"}
              </p>
              <p>
                <strong>📚 Предметы:</strong>{" "}
                {tutor.subjects && tutor.subjects.length > 0
                  ? tutor.subjects.map((s) => s.name).join(", ")
                  : "—"}
              </p>
              <p>
                <strong>💸 Цена за час:</strong>{" "}
                {tutor.price_per_hour ? `${tutor.price_per_hour}₸` : "Не указана"}
              </p>
              <p>
                <strong>⭐ Рейтинг:</strong> {tutor.rating?.toFixed(1) || "0.0"}
              </p>
            </div>
          ))
        ) : (
          <p>Пока нет доступных репетиторов 😢</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "20px",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  username: {
    marginBottom: "10px",
    color: "#007bff",
  },
  bio: {
    fontStyle: "italic",
    color: "#555",
    marginBottom: "10px",
  },
};
