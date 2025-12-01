import { ImageResponse } from "next/og";
import { GraduationCap } from "lucide-react";

export const size = 64;
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0ea5e9",
          borderRadius: 12,
        }}
      >
        <GraduationCap color="#ffffff" size={40} strokeWidth={2.5} />
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
