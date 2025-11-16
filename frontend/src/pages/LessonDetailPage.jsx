import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";

export default function LessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Поля для редактирования
  const [meetingLink, setMeetingLink] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState("");
  const [studentRating, setStudentRating] = useState("");
  const [studentFeedback, setStudentFeedback] = useState("");

  const userRole = localStorage.getItem("role"); // мы уже используем это в заявках

  const [isEditingHomework, setIsEditingHomework] = useState(false);
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Функция сохранения
  const saveHomework = async () => {
    try {
      await updateLesson({ homework }); // твой API-запрос
      setIsEditingHomework(false);      // закрываем форму
    } catch (err) {
      console.error(err);
    }
  };

  const saveMeetingLink = async () => {
    try {
      await updateLesson({ meeting_link: meetingLink });
      setIsEditingMeeting(false);
    } catch (err) {
      console.error(err);
    }
  };

  const saveFeedback = async () => {
    try {
      await updateLesson({
        student_rating: studentRating,
        student_feedback: studentFeedback,
      });
      setIsEditingFeedback(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLesson();
    // eslint-disable-next-line
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const res = await axiosInstance.get(`/lessons/${lessonId}/`);
      setLesson(res.data);

      // Заполнить поля формы начальными значениями
      setMeetingLink(res.data.meeting_link || "");
      setHomework(res.data.homework || "");
      setStudentRating(res.data.student_rating || "");
      setStudentFeedback(res.data.student_feedback || "");
      setStatus(res.data.status);

    } catch (err) {
      console.error("Ошибка загрузки урока:", err);
    }
    setLoading(false);
  };

  const updateLesson = async (payload) => {
    try {
      await axiosInstance.patch(`/lessons/${lessonId}/`, payload);
      fetchLesson();
    } catch (err) {
      console.error("Ошибка обновления урока:", err);
      alert(err.response?.data?.detail || "Ошибка");
    }
  };

  if (loading || !lesson) return <p>Загрузка...</p>;

  const isTutor = userRole === "tutor";
  const isStudent = userRole === "student";

  const now = dayjs();
  const lessonStart = dayjs(lesson.start_time);

  const canEdit =
    lesson.status !== "missed" &&
    (isTutor || (isStudent && lesson.status === "completed"));

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Назад</button>

      <h2 style={styles.title}>Урок #{lesson.id}</h2>

      <div style={styles.section}>
        <p><b>Предмет:</b> {lesson.subject.name}</p>
        
        {isTutor && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px", // небольшой отступ между "Студент:" и именем
            fontSize: "15px",
          }}>
            <p><b>Студент:</b></p>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profiles/${lesson.student.id}`);
              }}
              style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
            >
              {lesson.student.first_name || lesson.student.last_name ? `${lesson.student.first_name || ""} ${lesson.student.last_name || ""}`.trim() : lesson.student.username}
            </span>
          </div>
        )}

        {isStudent && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px", // небольшой отступ между "Студент:" и именем
            fontSize: "15px",
          }}>
            <p><b>Репетитор:</b></p>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profiles/${lesson.tutor.id}`);
              }}
              style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
            >
              {lesson.tutor.first_name || lesson.tutor.last_name ? `${lesson.tutor.first_name || ""} ${lesson.tutor.last_name || ""}`.trim() : lesson.tutor.username}
            </span>
          </div>
        )}

        <p><b>Время:</b> {dayjs(lesson.start_time).format("DD MMM HH:mm")} — {dayjs(lesson.end_time).format("HH:mm")}</p>

        <p><b>Статус:</b> {lesson.status_display}</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.subtitle}>Ссылка на урок</h3>
        <p>{lesson.meeting_link || "—"}</p>

        {/* Репетитор — редактирует meeting_link только если запланировано */}
        {isTutor && lesson.status === "scheduled" && (
          <div style={{ marginTop: 10 }}>
            {!isEditingMeeting ? (
              <>
                <button style={styles.btn} onClick={() => setIsEditingMeeting(true)}>
                  ✏️ Редактировать
                </button>
              </>
            ) : (
              <>
                <input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="Ссылка на урок"
                  style={styles.input}
                />
                <button style={styles.btn} onClick={saveMeetingLink}>
                  💾 Сохранить
                </button>
                <button
                  style={styles.btnDanger}
                  onClick={() => {
                    setIsEditingMeeting(false);
                    setMeetingLink(lesson.meeting_link || "");
                  }}
                >
                  ❌ Отмена
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.subtitle}>Домашнее задание</h3>
        <p>{lesson.homework || "—"}</p>

        {/* Репетитор — добавляет homework только если завершён */}
        {isTutor && lesson.status === "completed" && (
          <div style={{ marginTop: 10 }}>
            {!isEditingHomework ? (
              <>
                <button style={styles.btn} onClick={() => setIsEditingHomework(true)}>
                  ✏️ Редактировать
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  placeholder="Домашнее задание"
                  style={styles.textarea}
                />
                <button style={styles.btn} onClick={saveHomework}>
                  💾 Сохранить
                </button>
                <button
                  style={styles.btnDanger}
                  onClick={() => {
                    setIsEditingHomework(false);
                    setHomework(lesson.homework || ""); // откатываем текст
                  }}
                >
                  ❌ Отмена
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.subtitle}>Обратная связь студента</h3>
        <p><b>Оценка:</b> {lesson.student_rating || "—"}</p>
        <p><b>Комментарий:</b> {lesson.student_feedback || "—"}</p>

        {/* Студент — оценка + отзыв только после завершения */}
        {isStudent && lesson.status === "completed" && (
          <div style={{ marginTop: 10 }}>
            {!isEditingFeedback ? (
              <>
                <button style={styles.btn} onClick={() => setIsEditingFeedback(true)}>
                  ✏️ Редактировать
                </button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={studentRating}
                  onChange={(e) => setStudentRating(e.target.value)}
                  placeholder="Оценка (1–5)"
                  style={styles.input}
                />
                <textarea
                  value={studentFeedback}
                  onChange={(e) => setStudentFeedback(e.target.value)}
                  placeholder="Комментарий"
                  style={styles.textarea}
                />
                <button style={styles.btn} onClick={saveFeedback}>
                  💾 Отправить
                </button>
                <button
                  style={styles.btnDanger}
                  onClick={() => {
                    setIsEditingFeedback(false);
                    setStudentRating(lesson.student_rating || "");
                    setStudentFeedback(lesson.student_feedback || "");
                  }}
                >
                  ❌ Отмена
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Репетитор — может завершить/пропустить урок, когда он уже начался */}
      {isTutor && lesson.status === "in_progress" && now.isAfter(lessonStart) && (
        <div style={styles.card}>
          <h3 style={styles.subtitle}>Завершить урок</h3>

          <button
            style={styles.btn}
            onClick={() => updateLesson({ status: "completed" })}
          >
            Завершён
          </button>
          <button
            style={styles.btnDanger}
            onClick={() => updateLesson({ status: "missed" })}
          >
            Пропущен
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  backBtn: {
    marginBottom: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
  },
  title: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    background: "#fafafa",
    border: "1px solid #eee",
  },
  card: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    background: "#fdfdfd",
    border: "1px solid #eee",
  },
  subtitle: {
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 8,
    marginTop: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: 8,
    height: 80,
    marginTop: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  btn: {
    marginTop: 10,
    padding: "8px 14px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnDanger: {
    marginTop: 10,
    marginLeft: 10,
    padding: "8px 14px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
