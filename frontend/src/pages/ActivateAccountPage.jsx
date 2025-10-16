import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";

export default function ActivateAccountPage() {
  const { code } = useParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"

  useEffect(() => {
    const activate = async () => {
      try {
        const response = await axios.get(`/auth/activate/${code}/`);
        if (response.status === 200) {
          setStatus("success");
        }
      } catch (error) {
        setStatus("error");
      }
    };
    activate();
  }, [code]);

  if (status === "loading") return <p>⏳ Активация аккаунта...</p>;
  if (status === "success") return <p>✅ Аккаунт успешно активирован! Можете войти.</p>;
  if (status === "error") return <p>❌ Неверная или устаревшая ссылка.</p>;
}
