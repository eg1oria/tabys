import { Socials, socialLinks } from "@/components/layout/socials";
import { Mail, Phone, Pin } from "@/components/ui/icons";
import { getContacts } from "@/lib/api/public";
import { phoneHref } from "@/lib/content/company";

export async function ContactCards() {
  const contacts = await getContacts();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-card bg-ink p-6 text-white">
        <div className="flex items-center gap-3">
          <Pin className="size-5 text-accent" />
          <h3 className="text-[13px] font-medium">Адрес</h3>
        </div>
        <p className="mt-5 text-[14px] leading-relaxed text-white/80">{contacts.address}</p>
      </div>

      <div className="rounded-card bg-ink p-6 text-white">
        <div className="flex items-center gap-3">
          <Phone className="size-5 text-accent" />
          <h3 className="text-[13px] font-medium">Телефоны</h3>
        </div>
        <ul className="mt-5 space-y-3">
          {contacts.phones.map((phone) => (
            <li key={phone.digits}>
              <a
                href={phoneHref(phone)}
                className="block text-[14px] text-white transition-colors hover:text-accent"
              >
                {phone.display}
              </a>
              <span className="text-[12px] text-white/45">{phone.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-card bg-ink p-6 text-white">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-accent" />
          <h3 className="text-[13px] font-medium">Email</h3>
        </div>
        <a
          href={`mailto:${contacts.email}`}
          className="mt-5 inline-block text-[14px] text-white underline underline-offset-4 transition-colors hover:text-accent"
        >
          {contacts.email}
        </a>
      </div>

      {socialLinks(contacts).length > 0 ? (
        <div className="rounded-card bg-ink p-6 text-white">
          <h3 className="text-[13px] font-medium">Мессенджеры</h3>
          <Socials contacts={contacts} className="mt-5" />
        </div>
      ) : null}
    </div>
  );
}
