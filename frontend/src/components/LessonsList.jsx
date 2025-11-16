import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function LessonsList() {
  const [lessons, setLessons] = useState([]);
  const [role, setRole] = useState(null);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Список предметов
  const [subjects, setSubjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
    fetchProfile();
    fetchSubjects();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await axiosInstance.get("/lessons/");
      setLessons(res.data);
    } catch (err) {
      console.error("Ошибка загрузки уроков:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/profiles/me/");
      setRole(res.data.role);
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axiosInstance.get("/profiles/subjects/");
      setSubjects(res.data);
    } catch (err) {
      console.error("Ошибка загрузки предметов:", err);
    }
  };

  const openLesson = (lessonId) => {
    navigate(`/lessons/${lessonId}/`);
  };

  const renderUserName = (lesson) => {
    if (role === "tutor") {
      const name = `${lesson.student.first_name || ""} ${lesson.student.last_name || ""}`.trim() || lesson.student.username;
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profiles/${lesson.student.id}`);
          }}
          style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
        >
          {name}
        </span>
      );
    } else {
      const name = `${lesson.tutor.first_name || ""} ${lesson.tutor.last_name || ""}`.trim() || lesson.tutor.username;
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profiles/${lesson.tutor.id}`);
          }}
          style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
        >
          {name}
        </span>
      );
    }
  };

  // Фильтрация
  const filteredLessons = lessons.filter((lesson) => {
    const name = renderUserName(lesson).props.children.toLowerCase();
    const matchesStatus = !statusFilter || lesson.status === statusFilter;
    const matchesSubject = !subjectFilter || lesson.subject_name === subjectFilter;
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSubject && matchesSearch;
  });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📚 Мои уроки</h3>

      {/* Фильтры */}
      <div style={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">Все статусы</option>
          <option value="scheduled">Запланирован</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Завершён</option>
          <option value="missed">Пропущен</option>
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">Все предметы</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={role === "tutor" ? "Поиск по ученику..." : "Поиск по репетитору..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.search}
        />
      </div>

      {/* Список уроков */}
      <div style={styles.listContainer}>
        {filteredLessons.length === 0 && <p style={styles.empty}>Уроков не найдено</p>}

        <div style={styles.list}>
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} onClick={() => openLesson(lesson.id)} style={styles.card}>
              <div style={styles.row}>
                <b>{dayjs(lesson.start_time).format("DD MMM YYYY HH:mm")}</b>
              </div>
              <div style={styles.row}>
                {role === "tutor" ? "Ученик: " : "Репетитор: "} <b>{renderUserName(lesson)}</b>
              </div>
              <div style={styles.row}>
                Предмет: <b>{lesson.subject.name || "—"}</b>
              </div>
              <div style={styles.status(lesson.status)}>
                {lesson.status_display}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: "18px",
    marginBottom: "12px",
  },
  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  filterSelect: {
    flex: 1,
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  search: {
    flex: 1,
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  listContainer: {
    maxHeight: "600px",
    overflowY: "auto",
    paddingRight: "5px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    border: "1px solid #e3e3e3",
    padding: "15px",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#fafafa",
    transition: "0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  row: {
    fontSize: "15px",
  },
  status: (status) => ({
    padding: "6px 10px",
    borderRadius: "5px",
    fontSize: "13px",
    width: "fit-content",
    backgroundColor:
      status === "scheduled"
        ? "#d1e7dd"
        : status === "in_progress"
        ? "#fff3cd"
        : status === "completed"
        ? "#cfe2ff"
        : "#f8d7da",
    color:
      status === "scheduled"
        ? "#0f5132"
        : status === "in_progress"
        ? "#664d03"
        : status === "completed"
        ? "#084298"
        : "#842029",
    border:
      status === "scheduled"
        ? "1px solid #badbcc"
        : status === "in_progress"
        ? "1px solid #ffecb5"
        : status === "completed"
        ? "1px solid #b6d4fe"
        : "1px solid #f5c2c7",
  }),
  empty: {
    textAlign: "center",
    color: "#777",
    padding: "10px 0",
  },
};
