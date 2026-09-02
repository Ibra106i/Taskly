import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const alt = "TaskMax — Organize your tasks";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F7F5F0",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#45645e",
            letterSpacing: "-0.02em",
          }}
        >
          TaskMax
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#6b7c72",
            marginTop: 16,
          }}
        >
          Organize your tasks with AI
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 8,
              borderRadius: 4,
              background: "#45645e",
              opacity: 0.3,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
