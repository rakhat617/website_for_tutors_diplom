import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00–22:00
const DAYS = 7;

export default function TutorCalendarStudentView({ tutorId }) {
  const [slots, setSlots] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const today = dayjs();

  useEffect(() => {
    if (tutorId) fetchSlotsForWeek(currentWeek);
  }, [currentWeek, tutorId]);

  const fetchSlotsForWeek = async (weekStart) => {
    try {
      const start_date = weekStart.format("YYYY-MM-DD");
      const end_date = weekStart.add(6, "day").format("YYYY-MM-DD");

      const res = await axiosInstance.get(
        `/lessons/tutors/${tutorId}/timeslots/?start_date=${start_date}&end_date=${end_date}`
      );

      const slotsData = res.data || [];
      setSlots(slotsData);

      // Получаем уникальные предметы репетитора
      if (slotsData.length > 0) {
        const tutorSubjects = slotsData[0].tutor.subjects; // массив объектов {id, name}
        setSubjects(tutorSubjects);
        if (tutorSubjects.length > 0) setSelectedSubject(tutorSubjects[0].id); // по умолчанию первый
      }
    } catch (err) {
      console.error("Ошибка загрузки тайм-слотов:", err);
      setSlots([]);
      setSubjects([]);
      setSelectedSubject(null);
    }
  };

  const handleBooking = async (slot) => {
    if (!slot || slot.is_booked) return;

    if (!selectedSubject) {
      alert("❌ Пожалуйста, выберите предмет");
      return;
    }

    if (
      !window.confirm(
        `Забронировать слот ${dayjs(slot.start_time).format(
          "DD MMM, HH:mm"
        )} по выбранному предмету?`
      )
    ) {
      return;
    }

    try {
      const res = await axiosInstance.post("/lessons/bookings/", {
        timeslot_id: slot.id,
        subject_id: selectedSubject, // добавляем выбранный предмет
      });

      if (res.status === 201) {
        alert("✅ Заявка успешно отправлена репетитору!");
      } else {
        alert("⚠️ Не удалось создать заявку. Попробуйте позже.");
      }

      fetchSlotsForWeek(currentWeek);
    } catch (err) {
      console.error("Ошибка при бронировании:", err.response || err);
      if (err.response?.status === 400 && err.response?.data?.detail) {
        alert(`❌ ${err.response.data.detail}`);
      } else {
        alert("❌ Не удалось забронировать слот");
      }
    }
  };

  const renderCell = (dayIndex, hour) => {
    const slotDate = currentWeek.add(dayIndex, "day").hour(hour).minute(0).second(0);
    const slot = slots.find((s) => dayjs(s.start_time).isSame(slotDate));
    const isBooked = slot?.is_booked;
    const isPast = slotDate.isBefore(today, "hour");
    const isToday = slotDate.isSame(today, "day");

    let bgColor = "#f0f0f0";
    let title = "Нет слота";

    if (slot && !isBooked && !isPast) {
      bgColor = isToday ? "#8ee28e" : "#28a745";
      title = "Свободный слот — клик для бронирования";
    }
    if (slot && isBooked) {
      bgColor = "#dc3545";
      title = "Занято";
    }
    if (isPast) {
      bgColor = "#bdbdbd";
      title = "Прошедшее время";
    }

    return (
      <td
        key={hour}
        onClick={() => slot && !isBooked && !isPast && handleBooking(slot)}
        style={{
          width: 60,
          height: 40,
          textAlign: "center",
          cursor: slot && !isBooked && !isPast ? "pointer" : "not-allowed",
          backgroundColor: bgColor,
          color: isBooked || isPast ? "white" : "black",
          border: "1px solid #ddd",
          transition: "0.2s",
        }}
        title={title}
      >
        {hour}:00
      </td>
    );
  };

  const goToPrevWeek = () => setCurrentWeek(currentWeek.subtract(1, "week"));
  const goToNextWeek = () => setCurrentWeek(currentWeek.add(1, "week"));

  return (
    <div style={{ marginTop: 20, overflowX: "auto" }}>
      {/* Навигация по неделям */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={goToPrevWeek} style={styles.navButton}>← Предыдущая неделя</button>
        <h4>Неделя: {currentWeek.format("DD/MM")} - {currentWeek.add(6, "day").format("DD/MM")}</h4>
        <button onClick={goToNextWeek} style={styles.navButton}>Следующая неделя →</button>
      </div>

      {/* Селект предметов */}
      {subjects.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label>
            Выберите предмет:{" "}
            <select
              value={selectedSubject || ""}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Календарь */}
      <table style={{ borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ width: 50 }}></th>
            {Array.from({ length: DAYS }, (_, i) => {
              const day = currentWeek.add(i, "day");
              const isTodayHeader = day.isSame(today, "day");
              return (
                <th
                  key={i}
                  style={{
                    width: 60,
                    border: "1px solid #ddd",
                    backgroundColor: isTodayHeader ? "#d0e7ff" : "#f9f9f9",
                  }}
                >
                  {day.format("ddd DD/MM")}
                </th>
              );
            })}
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
