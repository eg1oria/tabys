import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </Base>
);

export const ArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Base>
);

export const ChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const Phone = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
  </Base>
);

export const Mail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </Base>
);

export const Pin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

export const Clock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const Search = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const Menu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const Close = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const Check = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);

export const Paperclip = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />
  </Base>
);

export const ExternalLink = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Base>
);

export const Copy = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M15 6V5.5A1.5 1.5 0 0 0 13.5 4h-9A1.5 1.5 0 0 0 3 5.5v9A1.5 1.5 0 0 0 4.5 16H5" />
  </Base>
);

export const Route = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 4 3 11l7 2.5L12.5 21 21 4Z" />
  </Base>
);

/* Иконки преимуществ и услуг */

export const Factory = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 20V10l6 3.5V10l6 3.5V7l6 3v10H3Z" />
    <path d="M7 16.5h2M13 16.5h2" />
  </Base>
);

export const Blueprint = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M3 9h18M8 9v11" />
    <path d="M12 13h5M12 16.5h5" />
  </Base>
);

export const Modules = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" />
  </Base>
);

export const Gear = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Base>
);

export const Shield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6L12 3Z" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </Base>
);

export const Truck = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 6h11v10H3z" />
    <path d="M14 9.5h4l3 3V16h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17.5" cy="18" r="1.8" />
  </Base>
);

export const Drop = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5s6 6.4 6 10.2a6 6 0 1 1-12 0C6 9.9 12 3.5 12 3.5Z" />
  </Base>
);

/* Мессенджеры — сплошная заливка */

export const WhatsApp = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.8-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.9-.6 3.1a11 11 0 0 0 4.6 5.1c1.8.9 2.6.9 3.3.8.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
  </svg>
);

export const Telegram = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 6.9-1.6 7.5c-.1.5-.4.7-.9.4l-2.4-1.8-1.2 1.1c-.1.1-.3.3-.6.3l.2-2.5 4.6-4.1c.2-.2 0-.3-.3-.1l-5.7 3.6-2.4-.8c-.5-.2-.5-.5.1-.8l9.4-3.6c.4-.2.8.1.8.8Z" />
  </svg>
);

export const Instagram = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1Zm0 3.2A6.6 6.6 0 1 0 18.6 12 6.6 6.6 0 0 0 12 5.4Zm0 10.9A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3Zm6.9-11.1a1.5 1.5 0 1 1-1.5-1.6 1.5 1.5 0 0 1 1.5 1.6Z" />
  </svg>
);

export const YouTube = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2 28.6 28.6 0 0 0 1 12a28.6 28.6 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28.6 28.6 0 0 0 23 12a28.6 28.6 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
  </svg>
);

// ───────────────────── иконки админки ─────────────────────

export const ChevronUp = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 15 6-6 6 6" />
  </Base>
);

export const ChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
);

export const Plus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Base>
);

export const Trash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Base>
);

export const Pencil = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m15 6 3 3" />
  </Base>
);

export const Upload = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </Base>
);

export const Download = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
  </Base>
);

export const ImageIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17 4.2-4.2a1.5 1.5 0 0 1 2.1 0l2.4 2.4 2-2a1.5 1.5 0 0 1 2.1 0l2.2 2.2" />
  </Base>
);

export const LogOut = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M10 12H3" />
    <path d="m6 8-3 4 3 4" />
  </Base>
);

export const Inbox = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 13h4l1.2 2.2h6.6L16.5 13h4" />
    <path d="M3.5 13 6 5h12l2.5 8v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5Z" />
  </Base>
);

export const Layers = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="m4 12.5 8 4.5 8-4.5" />
    <path d="m4 16.8 8 4.5 8-4.5" />
  </Base>
);

export const User = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Base>
);

export const Sliders = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h10M18 7h2" />
    <path d="M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Base>
);

export const AlertCircle = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4.5" />
    <path d="M12 16h.01" />
  </Base>
);

export const Home = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 10.5 8-6.5 8 6.5" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </Base>
);

export const Bell = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Base>
);

export const Dots = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </Base>
);

export const Calendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3.5v3M16 3.5v3" />
  </Base>
);

export const Grid = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </Base>
);

export const Rows = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const ChartUp = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="m7 15 4-4 3 3 5-6" />
  </Base>
);

export const Eye = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </Base>
);

export const Menu2 = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Base>
);
