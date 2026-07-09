import { ImageResponse } from "next/og";
import { SilverConnectMark } from "@/components/brand/Logo";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FBF7F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SilverConnectMark size={140} />
      </div>
    ),
    size,
  );
}
