import React, { useEffect, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import { useLocation } from "react-router-dom";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.roomName) {
      setSelectedChat(location.state.roomName);
    }
  }, [location.state]);

  return (
    <div style={styles.container}>
      <ChatSidebar onSelectChat={setSelectedChat} selectedChat={selectedChat} />
      {selectedChat ? (
        <ChatWindow roomName={selectedChat} />
      ) : (
        <div style={styles.placeholder}>
          <p>Выберите чат</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "80vh",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#888",
  },
};
