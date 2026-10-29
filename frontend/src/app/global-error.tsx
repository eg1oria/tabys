"use client";

/**
 * Последняя линия: сюда попадают сбои в корневом layout, когда обычный
 * error.tsx уже не отрисовать. Поэтому тут собственные <html> и <body>
 * и никаких импортов из проекта — он может быть ровно тем, что сломалось.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f4f5f7",
          color: "#0b0d0f",
        }}
      >
        <div style={{ maxWidth: "30rem", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem" }}>Сайт временно недоступен</h1>
          <p style={{ lineHeight: 1.6, color: "#6b7280" }}>
            Произошёл сбой при загрузке. Попробуйте обновить страницу.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.75rem",
              padding: "0 1.25rem",
              border: 0,
              borderRadius: 4,
              background: "#0b84f3",
              color: "#fff",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
