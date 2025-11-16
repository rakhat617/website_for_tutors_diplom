import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";

export default function TutorList() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // фильтры
  const [subject, setSubject] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-rating");
  const [page, setPage] = useState(1);

  // пагинация
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 6;

  // ✅ оборачиваем buildParams в useCallback
  const buildParams = useCallback(() => {
    const params = {};
    if (subject) params.subject = subject;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (minRating) params.min_rating = minRating;
    if (search) params.search = search;
    if (ordering) params.ordering = ordering;
    if (page) params.page = page;
    return params;
  }, [subject, minPrice, maxPrice, minRating, search, ordering, page]);

  const fetchTutors = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/profiles/tutors/", { params });
      setTutors(res.data.results || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      console.error("Ошибка при загрузке репетиторов:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ создаём дебаунс один раз
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(debounce(fetchTutors, 400), [fetchTutors]);

  useEffect(() => {
    const init = async () => {
      try {
        const [subsRes, tutorsRes] = await Promise.all([
          axiosInstance.get("/profiles/subjects/"),
          axiosInstance.get("/profiles/tutors/?ordering=-rating"),
        ]);
        setSubjects(subsRes.data);
        setTutors(tutorsRes.data.results || []);
        setTotalCount(tutorsRes.data.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ✅ теперь зависимость buildParams корректно обёрнута
  useEffect(() => {
    const params = buildParams();
    debouncedFetch(params);
  }, [buildParams, debouncedFetch]);

  const clearFilters = () => {
    setSubject("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSearch("");
    setOrdering("-rating");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎓 Найди своего репетитора</h2>

      {/* Панель фильтров */}
      <div style={styles.filters}>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input}>
          <option value="">Все предметы</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Мин. цена"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          placeholder="Макс. цена"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={styles.input}
        />
        <input
          type="number"
          placeholder="Мин. рейтинг"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          step="0.1"
          min="0"
          max="5"
          style={styles.input}
        />
        <input
          type="search"
          placeholder="Поиск по имени или описанию"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          style={{ ...styles.input, flex: 1 }}
        />

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)} style={styles.input}>
          <option value="-rating">Сначала лучшие</option>
          <option value="rating">Сначала худшие</option>
          <option value="price_per_hour">По возрастанию цены</option>
          <option value="-price_per_hour">По убыванию цены</option>
          <option value="username">По имени (A-Z)</option>
        </select>

        <button onClick={clearFilters} style={styles.clearButton}>
          Сбросить
        </button>
      </div>

      {/* Список */}
      {loading ? (
        <p style={{ textAlign: "center" }}>Загрузка репетиторов...</p>
      ) : (
        <>
          <div style={styles.grid}>
            {tutors.length === 0 ? (
              <p>Ничего не найдено</p>
            ) : (
              tutors.map((tutor) => (
                <div key={tutor.id} style={styles.card} onClick={() => navigate(`/profiles/${tutor.id}`)}>
                  <h3 style={styles.username}>
                    {`${tutor.first_name || ""} ${tutor.last_name || ""}`.trim()}
                  </h3>
                  <p style={styles.bio}>{tutor.bio || "Описание отсутствует"}</p>
                  <p>
                    <strong>Предметы:</strong>{" "}
                    {tutor.subjects?.map((s) => s.name).join(", ") || "—"}
                  </p>
                  <p>
                    <strong>Цена:</strong>{" "}
                    {tutor.price_per_hour ? `${tutor.price_per_hour}₸` : "Не указана"}
                  </p>
                  <p>
                    <strong>⭐</strong> {tutor.rating?.toFixed(1) || "0.0"}
                  </p>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={styles.pageButton}>⏮</button>
              <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} style={styles.pageButton}>←</button>

              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    ...styles.pageButton,
                    ...(p === page ? styles.activePage : {}),
                  }}
                >
                  {p}
                </button>
              ))}

              <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} style={styles.pageButton}>→</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={styles.pageButton}>⏭</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 1000, margin: "40px auto", padding: 20 },
  title: { textAlign: "center", marginBottom: 16 },
  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: 120,
  },
  clearButton: {
    padding: "8px 12px",
    backgroundColor: "#eee",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  card: {
    cursor: "pointer",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
  },
  username: { color: "#007bff", marginBottom: 6 },
  bio: { fontStyle: "italic", color: "#555" },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 25,
  },
  pageButton: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: 35,
  },
  activePage: {
    backgroundColor: "#007bff",
    color: "white",
    border: "1px solid #007bff",
  },
};
