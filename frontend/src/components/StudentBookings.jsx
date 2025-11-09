import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);

  async function loadBookings() {
    const res = await axiosInstance.get("/lessons/bookings/");
    setBookings(res.data);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="bookings">
      <h2>Мои заявки</h2>
      {bookings.length === 0 && <p>Вы пока не бронировали слоты</p>}

      {bookings.map((b) => (
        <div key={b.id} className="booking-item">
          <p>
            Репетитор: <b>
                {b.tutor.first_name && b.tutor.last_name
                    ? `${b.tutor.first_name} ${b.tutor.last_name}`
                    : b.tutor.username}
                </b><br />
            Слот: {new Date(b.timeslot.start_time).toLocaleString()} <br />
            Предмет: <b>{b.subject}</b> <br />
            Статус: <b>{b.status}</b>
          </p>
        </div>
      ))}
    </div>
  );
}
