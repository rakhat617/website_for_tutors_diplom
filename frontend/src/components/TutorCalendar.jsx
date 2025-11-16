import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const DAYS = 7;

export default function TutorCalendar() {
  const [slots, setSlots] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [selectedSlot, setSelectedSlot] = useState(null); // теперь весь слот
  const today = dayjs();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSlotsForWeek(currentWeek);
  }, [currentWeek]);

  const fetchSlotsForWeek = async (weekStart) => {
    try {
      const start_date = weekStart.format("YYYY-MM-DD");
      const end_date = weekStart.add(6, "day").format("YYYY-MM-DD");
      const res = await axiosInstance.get(
        `/lessons/timeslots/?start_date=${start_date}&end_date=${end_date}`
      );
      setSlots(res.data);
    } catch (err) {
      console.error("Ошибка загрузки тайм слотов:", err);
    }
  };

  const toggleSlot = async (dayIndex, hour) => {
    const slotDate = currentWeek.add(dayIndex, "day").hour(hour).minute(0).second(0);
    if (slotDate.isBefore(today)) return;

    const existing = slots.find((s) => dayjs(s.start_time).isSame(slotDate));

    try {
      if (existing) {
        await axiosInstance.delete(`/lessons/timeslots/${existing.id}/`);
      } else {
        await axiosInstance.post("/lessons/timeslots/", {
          start_time: slotDate.toISOString(),
          end_time: slotDate.add(1, "hour").toISOString(),
        });
      }
      fetchSlotsForWeek(currentWeek);
    } catch (err) {
      console.error("Ошибка при изменении слота:", err);
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axiosInstance.patch(`/lessons/bookings/${bookingId}/`, { status: newStatus });
      setSelectedSlot(null);
      fetchSlotsForWeek(currentWeek);
    } catch (err) {
      console.error("Ошибка при обновлении статуса:", err);
    }
  };

  const renderCell = (dayIndex, hour) => {
    const slotDate = currentWeek.add(dayIndex, "day").hour(hour).minute(0).second(0);
    const existing = slots.find((s) => dayjs(s.start_time).isSame(slotDate));

    const isBooked = existing?.is_booked;
    const hasPending = existing?.has_pending_booking;

    const isPast = slotDate.isBefore(today);
    const isToday = slotDate.isSame(today, "day");

    let bgColor = "#f0f0f0";
    if (existing) bgColor = "#28a745";
    if (isBooked) bgColor = "#dc3545";
    if (hasPending) bgColor = "#ffc107";
    if (isToday && !isPast && !existing) bgColor = "#d0e7ff";
    if (isPast) bgColor = "#ccc";

    const canEdit = !isBooked && !hasPending && !isPast;
    const canClickBooking = isBooked || hasPending;

    return (
      <td
        key={hour}
        onClick={() =>
          canEdit ? toggleSlot(dayIndex, hour) : canClickBooking ? handleSlotClick(existing) : null
        }
        style={{
          width: 60,
          height: 40,
          textAlign: "center",
          cursor: canEdit ? "pointer" : canClickBooking ? "pointer" : "not-allowed",
          backgroundColor: bgColor,
          color: existing || isPast ? "white" : "black",
          border: "1px solid #ddd",
          transition: "0.2s",
        }}
        title={
          existing
            ? isBooked
              ? `Занят: ${existing.accepted_booking?.student_first_name || existing.accepted_booking?.student_username}`
              : hasPending
              ? `Заявки в ожидании: ${existing.pending_bookings.map(b => b.student_username).join(", ")}`
              : "Свободный слот. Клик для удаления"
            : "Клик для добавления"
        }
      >
        {hour}:00
      </td>
    );
  };

  const goToPrevWeek = () => setCurrentWeek(currentWeek.subtract(1, "week"));
  const goToNextWeek = () => setCurrentWeek(currentWeek.add(1, "week"));

  return (
    <div style={{ overflowX: "auto", marginLeft: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={goToPrevWeek} style={styles.navButton}>
          ← Предыдущая неделя
        </button>
        <h3>
          Неделя: {currentWeek.format("DD/MM")} - {currentWeek.add(6, "day").format("DD/MM")}
        </h3>
        <button onClick={goToNextWeek} style={styles.navButton}>
          Следующая неделя →
        </button>
      </div>

      <table style={{ borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ width: 50 }}></th>
            {Array.from({ length: DAYS }, (_, i) => (
              <th
                key={i}
                style={{
                  width: 60,
                  border: "1px solid #ddd",
                  backgroundColor: currentWeek.add(i, "day").isSame(today, "day")
                    ? "#d0e7ff"
                    : "#f9f9f9",
                }}
              >
                {currentWeek.add(i, "day").format("ddd DD/MM")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td style={{ border: "1px solid #ddd", textAlign: "center" }}>{hour}:00</td>
              {Array.from({ length: DAYS }, (_, dayIndex) => renderCell(dayIndex, hour))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🟢 модалка */}
      {selectedSlot && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.window}>
            <h3>Заявки на слот</h3>

            {/* accepted_booking */}
            {selectedSlot.accepted_booking && (
              <div style={{ marginBottom: 15 }}>
                <p>
                  <b>Студент:</b>{" "}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profiles/${selectedSlot.accepted_booking.student_id}`);
                    }}
                    style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {selectedSlot.accepted_booking.student_first_name
                      ? `${selectedSlot.accepted_booking.student_first_name} ${selectedSlot.accepted_booking.student_last_name}`
                      : selectedSlot.accepted_booking.student_username}
                  </span>
                </p>
                <p>
                  <b>Предмет:</b> {selectedSlot.accepted_booking.subject_name}
                </p>
                <p>
                  <b>Время:</b> {dayjs(selectedSlot.start_time).format("DD MMM HH:mm")}
                </p>
                <p>
                  <b>Статус:</b> {selectedSlot.accepted_booking.status}
                </p>
                <button
                  onClick={() =>
                    updateBookingStatus(selectedSlot.accepted_booking.id, "cancelled")
                  }
                >
                  🚫 Отменить урок
                </button>
              </div>
            )}

            {/* pending_bookings */}
            {selectedSlot.pending_bookings.length > 0 && (
              <div>
                <h4>Заявки в ожидании:</h4>
                {selectedSlot.pending_bookings.map((b) => (
                  <div
                    key={b.student_username}
                    style={{ marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 5 }}
                  >
                    <p>
                      <b>Студент:</b>{" "}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profiles/${b.student_id}`);
                        }}
                        style={{ color: "#6c63ff", cursor: "pointer", textDecoration: "underline" }}
                      >
                        {b.student_first_name
                          ? `${b.student_first_name} ${b.student_last_name}`
                          : b.student_username}
                      </span>
                    </p>
                    <p>
                      <b>Предмет:</b> {b.subject_name}
                    </p>
                    <p>
                      <b>Время:</b> {dayjs(selectedSlot.start_time).format("DD MMM HH:mm")}
                    </p>
                    <p>
                      <b>Статус:</b> {b.status}
                    </p>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => updateBookingStatus(b.id, "accepted")}>✅ Принять</button>
                      <button onClick={() => updateBookingStatus(b.id, "rejected")}>❌ Отклонить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedSlot(null)}
              style={{ marginTop: 20, backgroundColor: "#ccc" }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  navButton: {
    padding: "5px 10px",
    margin: "5px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  window: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    minWidth: "300px",
    textAlign: "left",
  },
};
