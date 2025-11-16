import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { getProfile } from "../api/api";
import { useNavigate } from "react-router-dom";
import TutorCalendar from "../components/TutorCalendar";
import StudentCalendar from "../components/StudentCalendar";
import TutorBookings from "../components/TutorBookings";
import StudentBookings from "../components/StudentBookings";
import LessonsList from "../components/LessonsList";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
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
          subject_ids: profileData.subjects.map((s) => s.id) || [],
        });

        // Получаем все предметы с бэка
        const res = await axiosInstance.get("profiles/subjects/");
        setSubjects(res.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubjectsChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, subject_ids: values });
  };

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
      <div style={styles.leftColumn}>
        <div style={styles.profileCard}>
          <h2 style={styles.title}>Мой профиль</h2>
          {message && <p style={styles.message}>{message}</p>}

          <p><b>Имя пользователя:</b> {profile.username}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Роль:</b> {profile.role === "tutor" ? "Репетитор" : "Ученик"}</p>

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
            <b>О себе:</b>
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

          {profile.role === "tutor" && (
            <>
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
                  <p>{profile.price_per_hour ? `${profile.price_per_hour} ₸` : "Не указана"}</p>
                )}
              </div>

              <div style={styles.field}>
                <b>Предметы:</b><br />
                {isEditing ? (
                  <select
                    multiple
                    name="subject_ids"
                    value={formData.subject_ids}
                    onChange={handleSubjectsChange}
                    style={styles.select}
                  >
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>{subj.name}</option>
                    ))}
                  </select>
                ) : (
                  <ul>
                    {profile.subjects.length > 0
                      ? profile.subjects.map((s) => <li key={s.id}>{s.name}</li>)
                      : "—"}
                  </ul>
                )}
              </div>
            </>
          )}

          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={styles.buttonEdit}>
              ✏️ Редактировать профиль
            </button>
          ) : (
            <div>
              <button onClick={handleSave} style={styles.buttonSave}>
                💾 Сохранить
              </button>
              <button onClick={() => setIsEditing(false)} style={styles.buttonCancel}>
                ❌ Отмена
              </button>
            </div>
          )}

          <button onClick={() => navigate("/chat")} style={styles.buttonChat}>
            💬 Открыть чаты
          </button>
        </div>
          <div>
            <LessonsList />
          </div>
      </div>

      <div style={styles.rightColumn}>
        {profile.role === "tutor" ? (
          <>
            <div style={styles.calendarContainer}>
              <h3 style={styles.calendarTitle}>📅 Моё расписание</h3>
              <TutorCalendar />
            </div>
            <div style={styles.bookingsContainer}>
              <h3 style={styles.calendarTitle}>📨 Заявки от учеников</h3>
              <TutorBookings />
            </div>
          </>
        ) : (
          <>
            <div style={styles.calendarContainer}>
              <h3 style={styles.calendarTitle}>📅 Моё расписание</h3>
              <StudentCalendar />
            </div>
            <div style={styles.bookingsContainer}>
              <h3 style={styles.calendarTitle}>📖 Мои бронирования</h3>
              <StudentBookings />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  select: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginTop: "5px",
    minHeight: "100px",
  },
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
    maxWidth: "500px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  leftColumn: {
    flex: "1 1 400px",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  rightColumn: {
    flex: "1 1 600px",
    minWidth: "500px",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  bookingsContainer: {
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
  message: {
    color: "#28a745",
  },
};
