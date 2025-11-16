import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function TutorBookings() {
  const [bookings, setBookings] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ status: "", subject: "", search: "" });
  const navigate = useNavigate();

  // Подгружаем предметы при монтировании
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await axiosInstance.get("/profiles/subjects/");
        setSubjects(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке предметов:", err);
      }
    }
    loadSubjects();
  }, []);

  // Загружаем заявки с применением фильтров
  useEffect(() => {
    async function loadBookings() {
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.subject) params.append("subject", filters.subject);
        if (filters.search) params.append("search", filters.search);

        const res = await axiosInstance.get(`/lessons/bookings/?${params.toString()}`);
        setBookings(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке заявок:", err);
      }
    }
    loadBookings();
  }, [filters]);

  // Обновление статуса заявки
  async function updateBookingStatus(id, status) {
    try {
      await axiosInstance.patch(`/lessons/bookings/${id}/`, { status });
      // Перезагрузка с применением текущих фильтров
      setFilters({ ...filters });
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
    }
  }

  // Функция для корректного отображения предмета

  return (
    <div className="bookings" style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "10px" }}>
      <h2>Заявки на занятия</h2>

      {/* Фильтры */}
      <div className="filters" style={{ marginBottom: 15, display: "flex", gap: 10 }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="accepted">Принятые</option>
          <option value="rejected">Отклонённые</option>
          <option value="cancelled">Отмененные</option>
        </select>

        <select
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
        >
          <option value="">Все предметы</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Поиск студента"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Список заявок */}
      {bookings.length === 0 && <p>Нет заявок</p>}

      {bookings.map((b) => (
        <div
          key={b.id}
          className="booking-item"
          style={{
            marginBottom: 10,
            border: "1px solid #ddd",
            padding: 8,
            borderRadius: 4,
          }}
        >
          <p>
            Студент:{" "}
            <b>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profiles/${b.student.id}`);
                }}
                style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
              >
                {b.student.first_name || b.student.last_name
                  ? `${b.student.first_name || ""} ${b.student.last_name || ""}`.trim()
                  : b.student.username}
              </span>
            </b>
            <br />
            Слот: {new Date(b.timeslot.start_time).toLocaleString()}
            <br />
            Предмет: <b>{b.subject}</b>
            <br />
            <div style={styles.status(b.status)}>
              {b.status_display}
            </div>
          </p>

          {b.status === "pending" && (
            <div>
              <button onClick={() => updateBookingStatus(b.id, "accepted")}>
                Принять
              </button>
              <button onClick={() => updateBookingStatus(b.id, "rejected")}>
                Отклонить
              </button>
            </div>
          )}
          {b.status === "accepted" && (
            <button onClick={() => updateBookingStatus(b.id, "cancelled")}>
              Отменить
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  status: (status) => ({
    padding: "6px 10px",
    borderRadius: "5px",
    fontSize: "13px",
    width: "fit-content",
    backgroundColor:
      status === "accepted"
        ? "#d1e7dd"
        : status === "pending"
        ? "#fff3cd"
        : "#f8d7da",
    color:
      status === "accepted"
        ? "#0f5132"
        : status === "pending"
        ? "#664d03"
        : "#842029",
    border:
      status === "accepted"
        ? "1px solid #badbcc"
        : status === "pending"
        ? "1px solid #ffecb5"
        : "1px solid #f5c2c7",
  }),
}