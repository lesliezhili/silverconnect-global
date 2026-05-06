import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2D6A5E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.7C5.8 17.4 2 13.5 2 9.5 2 6.4 4.4 4 7.5 4c1.7 0 3.4.8 4.5 2.1C13.1 4.8 14.8 4 16.5 4 19.6 4 22 6.4 22 9.5c0 4-3.8 7.9-10 12.2z" />
        </svg>
      </div>
    ),
    size,
  );
}
