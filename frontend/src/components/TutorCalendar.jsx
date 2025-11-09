import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 - 22:00
const DAYS = 7;

export default function TutorCalendar() {
  const [slots, setSlots] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const today = dayjs(); // текущая дата

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

    if (slotDate.isBefore(today)) return; // прошлое время нельзя редактировать

    const existing = slots.find(s => dayjs(s.start_time).isSame(slotDate));

    try {
      if (existing) {
        await axiosInstance.delete(`/lessons/timeslots/${existing.id}/`);
      } else {
        await axiosInstance.post("/lessons/timeslots/", {
          start_time: slotDate.toISOString(),
          end_time: slotDate.add(1, "hour").toISOString(),
        });
      }

      fetchSlotsForWeek(currentWeek); // авто-обновление
    } catch (err) {
      console.error("Ошибка при изменении слота:", err);
    }
  };

  const renderCell = (dayIndex, hour) => {
    const slotDate = currentWeek.add(dayIndex, "day").hour(hour).minute(0).second(0);
    const existing = slots.find(s => dayjs(s.start_time).isSame(slotDate));
    const isBooked = existing?.is_booked;

    const isPast = slotDate.isBefore(today); // время в прошлом
    const isToday = slotDate.isSame(today, "day");

    let bgColor = "#f0f0f0"; // обычный
    if (isPast) bgColor = "#ccc"; // прошлое
    if (existing) bgColor = "#28a745"; // слот занят/создан
    if (isBooked) bgColor = "#dc3545";
    if (isToday && !isPast && !existing) bgColor = "#d0e7ff"; // сегодня, свободный

    // Подсказка для слота
    let title = "Клик для добавления";
    if (existing) title = isBooked ? "Занят" : "Слот создан";
    if (isPast) title = "Прошедшее время";

    return (
      <td
        key={hour}
        onClick={() => !isBooked && !isPast && toggleSlot(dayIndex, hour)}
        style={{
          width: 60,
          height: 40,
          textAlign: "center",
          cursor: isBooked || isPast ? "not-allowed" : "pointer",
          backgroundColor: bgColor,
          color: existing || isPast ? "white" : "black",
          border: "1px solid #ddd",
          transition: "0.2s",
        }}
        title={title} // стандартный tooltip
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
        <button onClick={goToPrevWeek} style={styles.navButton}>← Предыдущая неделя</button>
        <h3>Неделя: {currentWeek.format("DD/MM")} - {currentWeek.add(6, "day").format("DD/MM")}</h3>
        <button onClick={goToNextWeek} style={styles.navButton}>Следующая неделя →</button>
      </div>

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
          {HOURS.map(hour => (
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
