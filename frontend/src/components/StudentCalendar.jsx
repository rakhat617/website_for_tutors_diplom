import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import dayjs from "dayjs";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00–22:00
const DAYS = 7;

export default function StudentCalendar() {
  const [bookings, setBookings] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get("/lessons/student-timeslots/");
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, []);

  const renderCell = (dayIndex, hour) => {
  const slotDate = currentWeek.add(dayIndex, "day").hour(hour).minute(0).second(0);

  const booking = bookings.find(b =>
    dayjs(b.start_time).isSame(slotDate, "hour")
  );

  let bgColor = "#f0f0f0";
  let title = "";

  if (booking && booking.status !== "rejected" && booking.status !== "cancelled") {
    bgColor = booking.status === "accepted" ? "#28a745" : "#ffc107";
    title = `${booking.tutor_name} — ${booking.subject_name} (${booking.status})`;
  }

  return (
    <td
      key={hour}
      style={{
        width: 60,
        height: 40,
        textAlign: "center",
        backgroundColor: bgColor,
        color: "black",
        border: "1px solid #ddd",
        cursor: "default",
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={goToPrevWeek}>← Предыдущая неделя</button>
        <h4>
          Неделя: {currentWeek.format("DD/MM")} - {currentWeek.add(6, "day").format("DD/MM")}
        </h4>
        <button onClick={goToNextWeek}>Следующая неделя →</button>
      </div>

      <table style={{ borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ width: 50 }}></th>
            {Array.from({ length: DAYS }, (_, i) => {
              const day = currentWeek.add(i, "day");
              return <th key={i} style={{ border: "1px solid #ddd" }}>{day.format("ddd DD/MM")}</th>;
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
