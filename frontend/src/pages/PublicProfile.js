import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import TutorCalendarStudentView from "../components/TutorCalendarStudentView";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [eligibleToReview, setEligibleToReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const navigate = useNavigate();
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const currentUserId = Number(localStorage.getItem("user_id"));
  console.log(currentUserId)
  const currentUserRole = localStorage.getItem("role"); // "tutor" или "student"

  useEffect(() => {
    // Получаем профиль репетитора/студента
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/profiles/${id}/`);
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };

    // Получаем отзывы репетитора
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/profiles/${id}/reviews/`);
        setReviews(res.data);

        // Проверяем, оставлял ли текущий пользователь отзыв
        const hasReviewed = res.data.some((r) => r.student_id === currentUserId);
        setUserHasReviewed(hasReviewed);
        setReviewsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    };

    // Проверяем, имеет ли студент право оставить отзыв
    const fetchEligibility = async () => {
      try {
        const res = await axiosInstance.get(`/profiles/${id}/is_eligible/`);
        setEligibleToReview(res.data.count >= 3);
        setUserHasReviewed(res.data.has_reviewed)
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchReviews();
    if (currentUserRole === "student") fetchEligibility();
  }, [id, currentUserId, currentUserRole]);

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

  const handleSubmitReview = async () => {
    try {
      await axiosInstance.post(`/profiles/${id}/reviews/`, {
        rating: newRating,
        comment: newComment,
      });

      // Обновляем список отзывов и флаг
      const res = await axiosInstance.get(`/profiles/${id}/reviews/`);
      setReviews(res.data);
      setUserHasReviewed(true);

      // Пересчитываем рейтинг репетитора
      const avgRating = res.data.reduce((sum, r) => sum + r.rating, 0) / res.data.length;
      await axiosInstance.patch(`/profiles/${id}/`, { rating: avgRating });
    } catch (err) {
      console.error(err);
      alert("Не удалось отправить отзыв");
    }
  };

  if (!profile) return <p style={{ textAlign: "center" }}>Загрузка...</p>;

  const isTutorProfile = profile.role === "tutor";

  return (
    <div style={styles.page}>
      {/* Левая колонка */}
      <div style={styles.leftColumn}>
        {/* Карточка профиля */}
        <div style={styles.card}>
          <h2>{profile.first_name} {profile.last_name}</h2>
          <p><strong>О себе:</strong> {profile.bio || "—"}</p>
          {isTutorProfile && (
            <>
              <p><strong>Предметы:</strong> {profile.subjects?.map(s => s.name).join(", ") || "—"}</p>
              <p><strong>Цена за час:</strong> {profile.price_per_hour ? `${profile.price_per_hour} ₸` : "Не указана"}</p>
              <p><strong>⭐ Рейтинг:</strong> {profile.rating?.toFixed(1) || "0.0"}</p>
            </>
          )}
          {id !== String(currentUserId) && (
            <button onClick={handleStartChat} style={styles.chatButton}>
              💬 Написать {isTutorProfile ? "репетитору" : "пользователю"}
            </button>
          )}
        </div>

        {/* Карточка формы добавления отзыва */}
        {isTutorProfile && currentUserId === "0" && (
          <div style={styles.card}>
            <h3>Оставить отзыв</h3>
            {!eligibleToReview && <p>Вы посетили недостаточно занятий репетитора, чтобы оставить ему отзыв</p>}
            {eligibleToReview && !userHasReviewed && (
              <>
                <label>Оценка (1–5):</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  style={styles.input}
                />
                <label>Комментарий:</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={styles.textarea}
                />
                <button onClick={handleSubmitReview} style={styles.btn}>
                  Отправить
                </button>
              </>
            )}
            {userHasReviewed && <p>Вы уже оставили отзыв этому репетитору</p>}
          </div>
        )}

        {/* Карточка со списком отзывов */}
        {isTutorProfile && (
          <div style={styles.card}>
            <h3>Отзывы студентов</h3>
            {reviews.length === 0 ? (
              <p>Отзывов пока нет</p>
            ) : (
              <div style={styles.reviewList}>
                {reviews.map((r) => (
                  <div key={r.id} style={styles.reviewCard}>
                    <b>{r.student_name}</b> — {r.rating} ⭐
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Правая колонка — календарь */}
      {isTutorProfile && (
        <div style={styles.calendarContainer}>
          <h3>📅 Расписание занятий</h3>
          <TutorCalendarStudentView tutorId={profile.id} />
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "30px",
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "20px",
  },
  leftColumn: {
    flex: "1 1 400px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  chatButton: {
    marginTop: "15px",
    backgroundColor: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "8px",
    margin: "5px 0 10px 0",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    margin: "5px 0 10px 0",
    border: "1px solid #ccc",
    borderRadius: "5px",
    minHeight: "60px",
  },
  btn: {
    backgroundColor: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  reviewList: {
    maxHeight: "300px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  reviewCard: {
    borderBottom: "1px solid #ddd",
    paddingBottom: "8px",
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
