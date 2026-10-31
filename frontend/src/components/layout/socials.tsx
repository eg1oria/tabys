import { company } from "@/lib/content/company";
import { Instagram, Telegram, WhatsApp, YouTube } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Только заполненные: ссылка без аккаунта хуже, чем никакой. */
const links = [
  { label: "WhatsApp", href: company.whatsapp, Icon: WhatsApp },
  { label: "Telegram", href: company.telegram, Icon: Telegram },
  { label: "Instagram", href: company.instagram, Icon: Instagram },
  { label: "YouTube", href: company.youtube, Icon: YouTube },
].filter((link): link is typeof link & { href: string } => Boolean(link.href));

export function Socials({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center gap-2.5", className)}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            className="grid size-10 place-items-center rounded-card border border-white/15 text-white/70 transition-colors hover:border-accent hover:text-accent"
          >
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
