import { Link } from "react-router-dom";
import { X, ExternalLink } from "lucide-react";
import type { Article } from "@/lib/types";
import { getOutlet } from "@/lib/data";
import { BiasTag } from "@/components/BiasIndicator";
import { BIAS_META } from "@/lib/types";

interface ArticlePopupProps {
  article: Article;
  onClose: () => void;
}

export function ArticlePopup({ article, onClose }: ArticlePopupProps) {
  const outlet = getOutlet(article.outletId);
  const ideology = outlet?.ideology;

  function getAxisLabel(y: number): string {
    if (y < -0.25) return "Progressief";
    if (y > 0.25) return "Conservatief";
    return "Gematigd";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <article
        className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-divider rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-divider px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent">
                {outlet?.name ?? article.outletId}
              </span>
              <span className="text-xs text-caption">•</span>
              <span className="text-xs font-mono text-caption">
                {new Date(article.publishedAt).toLocaleDateString("nl-NL", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {outlet && <BiasTag bias={outlet.bias} size="sm" />}
              {ideology && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-secondary text-caption">
                  {getAxisLabel(ideology.y)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary transition-colors text-caption hover:text-foreground shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <h2 className="font-headline text-2xl font-bold leading-tight text-headline mb-4">
            {article.headline}
          </h2>
          <p className="text-base text-body font-body leading-relaxed mb-6 border-l-2 border-accent/40 pl-4 italic">
            {article.summary}
          </p>
          <div className="text-base font-body leading-relaxed text-body whitespace-pre-line">
            {article.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-divider bg-surface-warm flex items-center justify-between gap-4">
          {outlet && (
            <p className="text-xs text-caption font-mono">
              {BIAS_META[outlet.bias].label} · {BIAS_META[outlet.bias].description}
            </p>
          )}
          <Link
            to={`/artikel/${article.id}`}
            onClick={onClose}
            className="shrink-0 flex items-center gap-1.5 text-xs font-body font-medium text-accent hover:underline"
          >
            Volledig artikel <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
