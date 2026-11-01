import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Знак из app/icon.svg без скругления: углы iOS обрезает сама. */
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#0b84f3"/><path d="M11 11.5h18M20 11.5v12" stroke="#fff" stroke-width="4.2" stroke-linecap="round" fill="none"/><path d="M20 27.5s-3 3.6-3 5.6a3 3 0 0 0 6 0c0-2-3-5.6-3-5.6Z" fill="#fff"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    <img src={`data:image/svg+xml,${encodeURIComponent(mark)}`} width={180} height={180} alt="" />,
    size,
  );
}
