import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { getProfile } from "../api/api";
import { useNavigate } from "react-router-dom";
import TutorCalendar from "../components/TutorCalendar";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          bio: profileData.bio || "",
          price_per_hour: profileData.price_per_hour || "",
        });
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const res = await axiosInstance.patch("/profiles/me/", formData);
      setProfile(res.data);
      setIsEditing(false);
      setMessage("✅ Профиль обновлён!");
    } catch {
      setMessage("❌ Ошибка при сохранении изменений.");
    }
  };

  if (!profile) return <p style={{ textAlign: "center" }}>Загрузка...</p>;

  return (
    <div style={styles.page}>
      {/* Левая часть — профиль */}
      <div style={styles.profileCard}>
        <h2 style={styles.title}>Мой профиль</h2>
        {message && <p style={styles.message}>{message}</p>}

        <p><b>Имя пользователя:</b> {profile.username}</p>
        <p><b>Email:</b> {profile.email}</p>
        <p>
          <b>Роль:</b>{" "}
          {profile.role === "tutor" ? "Репетитор" : "Ученик"}
        </p>

        <div style={styles.field}>
          <b>Имя:</b>
          {isEditing ? (
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={styles.input}
            />
          ) : (
            <p>{profile.first_name}</p>
          )}
        </div>

        <div style={styles.field}>
          <b>Фамилия:</b>
          {isEditing ? (
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={styles.input}
            />
          ) : (
            <p>{profile.last_name}</p>
          )}
        </div>

        <div style={styles.field}>
          <b>Описание:</b>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={styles.textarea}
            />
          ) : (
            <p>{profile.bio || "—"}</p>
          )}
        </div>

        <div style={styles.field}>
          <b>Цена за час:</b>
          {isEditing ? (
            <input
              name="price_per_hour"
              type="number"
              value={formData.price_per_hour}
              onChange={handleChange}
              style={styles.input}
            />
          ) : (
            <p>
              {profile.price_per_hour
                ? `${profile.price_per_hour} ₸`
                : "Не указана"}
            </p>
          )}
        </div>

        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={styles.buttonEdit}>
            ✏️ Редактировать профиль
          </button>
        ) : (
          <div>
            <button onClick={handleSave} style={styles.buttonSave}>
              💾 Сохранить
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={styles.buttonCancel}
            >
              ❌ Отмена
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/chat")}
          style={styles.buttonChat}
        >
          💬 Открыть чаты
        </button>
      </div>

      {/* Правая часть — календарь (только если репетитор) */}
      {profile.role === "tutor" && (
        <div style={styles.calendarContainer}>
          <h3 style={styles.calendarTitle}>📅 Моё расписание</h3>
          <TutorCalendar />
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
    alignItems: "flex-start",
    gap: "30px",
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "20px",
  },
  profileCard: {
    flex: "1 1 350px",
    maxWidth: "400px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "22px",
    marginBottom: "15px",
    color: "#333",
  },
  field: {
    marginTop: "15px",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  textarea: {
    width: "100%",
    height: "70px",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  buttonEdit: {
    marginTop: "20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  buttonSave: {
    marginTop: "20px",
    marginRight: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  buttonCancel: {
    marginTop: "20px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 15px",
    cursor: "pointer",
  },
  buttonChat: {
    marginTop: "25px",
    padding: "10px 20px",
    backgroundColor: "#6c63ff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "100%",
    cursor: "pointer",
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
  calendarTitle: {
    fontSize: "18px",
    marginBottom: "10px",
  },
  message: {
    color: "#28a745",
  },
};
