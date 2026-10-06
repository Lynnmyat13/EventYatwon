import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[62dvh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
          This page is not here.
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-7 text-muted-foreground">
          The link may be outdated, or the page may have moved.
        </p>
        <Link to="/" className={cn(buttonVariants(), "mt-7 h-11 rounded-lg px-4")}>
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Back home
        </Link>
      </div>
    </section>
  );
}
