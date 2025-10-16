import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { getProfile } from "../api/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");

  // 🔹 Получаем профиль и список предметов
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        setFormData({
          bio: profileData.bio || "",
          price_per_hour: profileData.price_per_hour || "",
          subject_ids: profileData.subjects.map((s) => s.id) || [],
        });

        const res = await axiosInstance.get("profiles/subjects/");
        setSubjects(res.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchData();
  }, []);

  // 🔹 Изменение полей формы
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Изменение списка предметов (мультиселект)
  const handleSubjectChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, subject_ids: values });
  };

  // 🔹 Сохранение изменений
  const handleSave = async () => {
    try {
      const res = await axiosInstance.patch("/profiles/me/", formData);
      setProfile(res.data);
      setIsEditing(false);
      setMessage("✅ Профиль успешно обновлён!");
    } catch (error) {
      console.error(error);
      setMessage("❌ Ошибка при сохранении изменений.");
    }
  };

  if (!profile) return <p>Загрузка...</p>;

  return (
    <div style={styles.container}>
      <h2>Профиль</h2>

      {message && <p>{message}</p>}

      <div style={styles.info}>
        <p><b>Имя пользователя:</b> {profile.username}</p>
        <p><b>Email:</b> {profile.email}</p>
        <p><b>Роль:</b> {profile.role === "tutor" ? "Репетитор" : "Студент"}</p>

        <div style={{ marginTop: "15px" }}>
          <b>Описание:</b><br />
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
            <div style={{ marginTop: "15px" }}>
              <b>Цена за час:</b><br />
              {isEditing ? (
                <input
                  type="number"
                  name="price_per_hour"
                  value={formData.price_per_hour}
                  onChange={handleChange}
                  style={styles.input}
                />
              ) : (
                <p>{profile.price_per_hour ? `${profile.price_per_hour}₸` : "—"}</p>
              )}
            </div>

            <div style={{ marginTop: "15px" }}>
              <b>Предметы:</b><br />
              {isEditing ? (
                <select
                  multiple
                  name="subject_ids"
                  value={formData.subject_ids}
                  onChange={handleSubjectChange}
                  style={styles.select}
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
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
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
  info: {
    lineHeight: "1.6",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    height: "80px",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  select: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  buttonEdit: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  buttonSave: {
    marginTop: "15px",
    marginRight: "10px",
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  buttonCancel: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
