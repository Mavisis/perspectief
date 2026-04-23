import { Link } from "react-router-dom";
import type { Article } from "@/lib/types";
import { getOutlet } from "@/lib/data";
import { BiasTag } from "@/components/BiasIndicator";

interface ArticleCardProps {
  article: Article;
  showEventLink?: boolean;
}

export function ArticleCard({ article, showEventLink = false }: ArticleCardProps) {
  const outlet = getOutlet(article.outletId)!;

  return (
    <Link
      to={`/artikel/${article.id}`}
      className="group block rounded-lg border-l-4 bg-card p-5 transition-all hover:shadow-sm"
      style={{
        borderLeftColor: `hsl(var(--bias-${outlet.bias}))`,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-caption">
          {outlet.name}
        </span>
        <BiasTag bias={outlet.bias} size="sm" />
      </div>

      <h3 className="mb-2 font-headline text-lg font-semibold leading-snug text-headline group-hover:text-accent transition-colors">
        {article.headline}
      </h3>

      <p className="text-sm text-body font-body leading-relaxed line-clamp-2">
        {article.summary}
      </p>

      <p className="mt-3 text-xs text-caption font-body">
        {new Date(article.publishedAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}
