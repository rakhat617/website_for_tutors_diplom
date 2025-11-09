import React, { useEffect, useState, useRef } from "react";

export default function ChatWindow({ roomName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [otherUser, setOtherUser] = useState(""); // 👈 добавили
  const chatContainerRef = useRef(null);

  const currentUser = localStorage.getItem("username");
  const accessToken = localStorage.getItem("access_token");

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!roomName) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${roomName.replace('chat_', '')}/?token=${accessToken}`);
    setSocket(ws);

    ws.onopen = () => console.log("✅ WebSocket connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message raw:", data); 

      if (data.type === "chat_message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "chat_history") {
        setMessages(data.messages);
        setOtherUser(data.otherUser); // 👈 вот здесь сохраняем имя собеседника
      }
    };

    ws.onclose = () => console.log("❌ WebSocket closed");

    return () => ws.close();
  }, [roomName, accessToken]);

  const sendMessage = () => {
    if (socket && newMessage.trim()) {
      socket.send(
        JSON.stringify({
          message: newMessage,
          sender: currentUser,
        })
      );
      setNewMessage("");
    }
  };

  return (
    <div style={styles.window}>
      <div style={styles.header}>
        <h3>
          {otherUser
            ? `${
                (otherUser.first_name || otherUser.last_name)
                  ? `${otherUser.first_name || ""}${
                      otherUser.last_name ? " " + otherUser.last_name : ""
                    }`
                  : otherUser.username
              }`
            : "Чат"}
        </h3>
      </div>

      <div style={styles.messages} ref={chatContainerRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(String(msg.senderId) === localStorage.getItem("user_id")
                ? styles.myMessage
                : styles.theirMessage),
            }}
          >
            <div style={styles.sender}>{msg.sender}</div>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={styles.button}>
          Отправить
        </button>
      </div>
    </div>
  );
}


const styles = {
  window: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f9f9f9",
  },
  header: {
    padding: "10px",
    backgroundColor: "#eee",
    borderBottom: "1px solid #ccc",
  },
  messages: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
  },
  message: {
    margin: "8px 0",
    padding: "8px 12px",
    borderRadius: "12px",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    textAlign: "right",
  },
  theirMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    textAlign: "left",
  },
  sender: {
    fontSize: "0.75rem",
    color: "#888",
    marginBottom: "4px",
  },
  inputArea: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginRight: "8px",
  },
  button: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
