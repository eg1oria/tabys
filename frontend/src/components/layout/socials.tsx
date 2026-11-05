import type { Contacts } from "@/lib/api/types";
import { Instagram, Telegram, WhatsApp, YouTube } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Только заполненные: ссылка без аккаунта хуже, чем никакой. */
export function socialLinks(contacts: Contacts) {
  return [
    { label: "WhatsApp", href: contacts.whatsapp, Icon: WhatsApp },
    { label: "Telegram", href: contacts.telegram, Icon: Telegram },
    { label: "Instagram", href: contacts.instagram, Icon: Instagram },
    { label: "YouTube", href: contacts.youtube, Icon: YouTube },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));
}

export function Socials({ contacts, className }: { contacts: Contacts; className?: string }) {
  const links = socialLinks(contacts);
  if (links.length === 0) return null;
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
