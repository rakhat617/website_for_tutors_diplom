import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import TutorCalendarStudentView from "../components/TutorCalendarStudentView";

export default function TutorProfile() {
  const { id } = useParams();
  const [tutor, setTutor] = useState(null);
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("user_id");

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

  const handleStartChat = async () => {
    try {
      const res = await axiosInstance.post("/chats/create_or_get/", {
        tutor_id: id,
      });
      const { room_name } = res.data;
      navigate("/chat", { state: { roomName: room_name } });
    } catch (err) {
      console.error("Ошибка при создании чата:", err);
      alert("Не удалось создать чат");
    }
  };

  if (!tutor) return <p style={{ textAlign: "center" }}>Загрузка...</p>;

  return (
    <div style={styles.page}>
      {/* Левая колонка — карточка с информацией */}
      <div style={styles.profileCard}>
        <h2 style={styles.name}>
          {tutor.first_name} {tutor.last_name}
        </h2>
        <p style={styles.text}><strong>О себе:</strong> {tutor.bio || "—"}</p>
        <p style={styles.text}>
          <strong>Предметы:</strong>{" "}
          {tutor.subjects?.length
            ? tutor.subjects.map((s) => s.name).join(", ")
            : "—"}
        </p>
        <p style={styles.text}>
          <strong>Цена за час:</strong>{" "}
          {tutor.price_per_hour ? `${tutor.price_per_hour} ₸` : "Не указана"}
        </p>
        <p style={styles.text}>
          <strong>⭐ Рейтинг:</strong> {tutor.rating?.toFixed(1) || "0.0"}
        </p>

        {id !== currentUserId && (
          <button onClick={handleStartChat} style={styles.chatButton}>
            💬 Написать репетитору
          </button>
        )}
      </div>

      {/* Правая колонка — календарь */}
      <div style={styles.calendarContainer}>
        <h3 style={{ marginBottom: "10px" }}>📅 Расписание занятий</h3>
        <TutorCalendarStudentView tutorId={tutor.id} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: "30px",
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "20px",
  },
  profileCard: {
    flex: "1 1 300px",
    maxWidth: "400px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  name: {
    fontSize: "22px",
    marginBottom: "15px",
    color: "#333",
  },
  text: {
    margin: "8px 0",
    fontSize: "16px",
  },
  chatButton: {
    marginTop: "20px",
    backgroundColor: "#6c63ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
    transition: "0.2s",
  },
  calendarContainer: {
    flex: "1 1 600px",
    minWidth: "500px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
};
