import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export default function ChatSidebar({ onSelectChat, selectedChat }) {
  const [chats, setChats] = useState([]);
  const currentUserId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axiosInstance.get("/chats/");
        setChats(res.data);
        console.log(res.data)
      } catch (e) {
        console.error("Ошибка при загрузке чатов:", e);
      }
    };
    fetchChats();
  }, []);

  return (
    <div style={styles.sidebar}>
      <h3>Чаты</h3>
      {chats.length === 0 && <p>Нет активных чатов</p>}
      {chats.map((chat) => {
        const otherUser = chat.participants.find(
          (p) => String(p.id) !== String(currentUserId)
        );
        const displayName = otherUser
          ? (otherUser.first_name || otherUser.last_name
              ? `${otherUser.first_name || ""}${otherUser.last_name ? " " + otherUser.last_name : ""}`
              : otherUser.username)
          : "Неизвестный";

        return (
          <div
            key={chat.id}
            style={{
              ...styles.chatItem,
              backgroundColor:
                selectedChat === chat.room_name ? "#e9f3ff" : "white",
            }}
            onClick={() => onSelectChat(chat.room_name)}
          >
            💬 {displayName}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    borderRight: "1px solid #ccc",
    padding: "10px",
    overflowY: "auto",
  },
  chatItem: {
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "8px",
  },
};
