import { ArrowUpRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:py-12">
          <div>
            <p className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Find something worth showing up for.
            </p>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-6 sm:text-base">
              Explore events, meet your community, and keep every ticket in one
              place.
            </p>
          </div>
          <Link
            to="/events"
            className={cn(buttonVariants({ size: "lg" }), "w-fit gap-2")}
          >
            Explore events
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block" aria-label="EventYatwon home">
              <BrandLogo className="h-8" />
            </Link>
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-6">
              A trusted place to discover gatherings and bring people together.
            </p>
            <Link
              to="/contact"
              className="text-foreground hover:text-primary mt-5 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Mail className="size-4" />
              Send us a message
            </Link>
          </div>

          <FooterLinks
            title="Discover"
            links={[
              { label: "Explore events", to: "/events" },
              { label: "Event calendar", to: "/calendar" },
              ...(user?.role === "attendee"
                ? [{ label: "Recommended", to: "/recommended" }]
                : []),
              { label: "About us", to: "/about" },
            ]}
          />
          <FooterLinks
            title="Support"
            links={[
              { label: "Help center", to: "/help" },
              { label: "Contact support", to: "/contact" },
            ]}
          />
          <FooterLinks
            title="Account"
            links={
              user
                ? [
                    { label: "My profile", to: "/profile" },
                    { label: "Dashboard", to: "/dashboard" },
                  ]
                : [
                    { label: "Log in", to: "/login" },
                    { label: "Create account", to: "/register" },
                  ]
            }
          />
        </div>

        <div className="text-muted-foreground flex flex-col gap-2 border-t py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© EventYatwon. All rights reserved.</p>
          <p>Events that bring people together.</p>
        </div>
      </div>
    </footer>
  );
}

interface FooterLink {
  label: string;
  to: string;
}

function FooterLinks({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={`${title} links`}>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
