import { Link } from "react-router-dom";

export function TrendingCategoriesMarquee({
  categories,
}: {
  categories: string[];
}) {
  if (!categories.length) return null;

  const repeated = Array.from(
    { length: Math.max(1, Math.ceil(8 / categories.length)) },
    () => categories,
  ).flat();

  const items = (links: boolean) =>
    repeated.map((category, index) =>
      links ? (
        <Link
          key={`${category}-${index}`}
          to={`/events?category=${encodeURIComponent(category)}`}
          className="shrink-0 px-6 py-4 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
        >
          {category} <span className="ml-6 text-blue-500">•</span>
        </Link>
      ) : (
        <span
          key={`${category}-${index}`}
          className="shrink-0 px-6 py-4 text-sm font-medium text-zinc-400"
        >
          {category} <span className="ml-6 text-blue-500">•</span>
        </span>
      ),
    );

  return (
    <div className="trending-marquee overflow-hidden border-y border-white/10 bg-[#080d18]">
      <div className="trending-marquee-track flex w-max">
        <div className="flex shrink-0">{items(true)}</div>
        <div className="flex shrink-0" aria-hidden="true">
          {items(false)}
        </div>
      </div>
    </div>
  );
}
