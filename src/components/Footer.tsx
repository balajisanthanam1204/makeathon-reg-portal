import { COORDINATORS } from "@/lib/constants";
import { Mail, MapPin, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-border">
      <div className="scan-line" />
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <h3
            data-text="MAKEATHON 7.0"
            className="glitch text-3xl sm:text-4xl mb-3"
          >
            MAKEATHON <span className="text-cyan-edge">7.0</span>
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            A 24-Hour Hackathon
          </p>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            National level 24-hour hardware &amp; software creation sprint organized by the
            Department of Electronics &amp; Communication Engineering, SVCE.
          </p>
        </div>

        {/* Coordinators */}
        <div>
          <h4 className="font-mono text-sm uppercase tracking-[0.25em] text-cyan-edge mb-4">
            Student Coordinators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {COORDINATORS.map((c) => (
              <a
                key={c.phone}
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="block group"
              >
                <p className="font-mono text-xs text-foreground group-hover:text-cyan-edge transition-colors truncate">
                  {c.name}
                  {c.role && (
                    <span className="ml-1 text-amber-edge text-[9px] uppercase">· {c.role}</span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-spider">{c.phone}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-mono text-sm uppercase tracking-[0.25em] text-cyan-edge mb-4">
            Contact Us
          </h4>
          <div className="flex items-start gap-2 mb-3">
            <MapPin size={14} className="text-spider flex-shrink-0 mt-0.5" />
            <address className="font-mono text-[11px] not-italic text-muted-foreground leading-relaxed">
              Sri Venkateswara College of Engineering<br />
              Post Bag No.1, Pennalur Village<br />
              Chennai - Bengaluru Highways<br />
              Sriperumbudur (off Chennai) Tk. - 602 117<br />
              Tamil Nadu, India
            </address>
          </div>
          <a
            href="mailto:makeathon@svce.ac.in"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-edge hover:text-foreground transition-colors"
          >
            <Mail size={13} /> makeathon@svce.ac.in
          </a>

          <div className="mt-6 space-y-3">
            {[
              { name: "RACE", color: "text-spider" },
              { name: "IETE-SF", color: "text-cyan-edge" },
              { name: "ECEA", color: "text-amber-edge" },
            ].map((club) => (
              <div key={club.name}>
                <p className={`font-mono text-[11px] uppercase tracking-wider ${club.color} mb-1`}>
                  {club.name}
                </p>
                <div className="flex gap-2">
                  <SocialIcon Icon={Instagram} />
                  <SocialIcon Icon={Linkedin} />
                  <SocialIcon Icon={Mail} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="font-mono text-sm text-foreground italic mb-2">
            "With great power comes great innovation."
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            © 2026 Makeathon 7.0 — All realities reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ Icon }: { Icon: typeof Mail }) {
  return (
    <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-cyan-edge hover:border-cyan-edge transition-colors cursor-pointer">
      <Icon size={13} />
    </span>
  );
}
