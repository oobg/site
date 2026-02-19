import { ExternalLink, Mail, Phone } from "lucide-react";

import { contacts } from "@/shared/content/profile";
import { cn } from "@/shared/lib/utils";

const linkClass = cn(
  "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors",
  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
);

export function AboutContacts() {
  return (
    <ul
      className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
      aria-label="연락처"
    >
      <li>
        <a href={`tel:${contacts.tel.replace(/\s/g, "")}`} className={linkClass}>
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {contacts.tel}
        </a>
      </li>
      <li>
        <a href={`mailto:${contacts.email}`} className={linkClass}>
          <Mail className="size-3.5 shrink-0" aria-hidden />
          {contacts.email}
        </a>
      </li>
      <li>
        <a
          href={contacts.github}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Github
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </a>
      </li>
    </ul>
  );
}
