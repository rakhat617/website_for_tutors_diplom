import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export default function TutorBookings() {
  const [bookings, setBookings] = useState([]);

  async function loadBookings() {
    const res = await axiosInstance.get("/lessons/bookings/");
    setBookings(res.data);
  }

  async function updateBookingStatus(id, status) {
    await axiosInstance.patch(`/lessons/bookings/${id}/`, { status });
    await loadBookings();
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="bookings">
      <h2>Заявки на занятия</h2>
      {bookings.length === 0 && <p>Нет заявок</p>}

      {bookings.map((b) => (
        <div key={b.id} className="booking-item">
          <p>
            Студент: <b>
                {b.student.first_name && b.student.last_name
                    ? `${b.student.first_name} ${b.student.last_name}`
                    : b.student.username}
                </b><br />
            Слот: {new Date(b.timeslot.start_time).toLocaleString()} <br />
            Предмет: <b>{b.subject}</b> <br />
            Статус: <b>{b.status}</b>
          </p>
          {b.status === "pending" && (
            <div>
              <button onClick={() => updateBookingStatus(b.id, "accepted")}>Принять</button>
              <button onClick={() => updateBookingStatus(b.id, "rejected")}>Отклонить</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
