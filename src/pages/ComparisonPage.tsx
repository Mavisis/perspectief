import { useParams, Link } from "react-router-dom";
import { useArticle } from "@/hooks/useArticle";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BiasTag } from "@/components/BiasIndicator";
import type { BiasLabel } from "@/lib/types";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";

export default function ComparisonPage() {
  const { idA, idB } = useParams<{ idA: string; idB: string }>();
  const { article: articleA, isLoading: loadingA } = useArticle(idA);
  const { article: articleB, isLoading: loadingB } = useArticle(idB);

  if (loadingA || loadingB) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex-1 py-12 grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-32 rounded bg-muted animate-pulse" />
              <div className="h-8 w-full rounded bg-muted animate-pulse" />
              <div className="h-40 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </main>
        <Footer />
      </div>
    );
  }

  if (!articleA || !articleB) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex flex-1 items-center justify-center py-20">
          <p className="text-lg text-muted-foreground font-body">Artikelen niet gevonden.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const outletA = (articleA as any).outlet;
  const outletB = (articleB as any).outlet;
  const biasA = (outletA?.bias ?? "center") as BiasLabel;
  const biasB = (outletB?.bias ?? "center") as BiasLabel;

  const wordsA = new Set(articleA.headline.toLowerCase().split(/\s+/));
  const wordsB = new Set(articleB.headline.toLowerCase().split(/\s+/));
  const sharedWords = [...wordsA].filter((w) => wordsB.has(w) && w.length > 3);
  const uniqueA = [...wordsA].filter((w) => !wordsB.has(w) && w.length > 3);
  const uniqueB = [...wordsB].filter((w) => !wordsA.has(w) && w.length > 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container py-8">
          <Link
            to={`/gebeurtenis/${articleA.eventId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-caption font-body hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar gebeurtenis
          </Link>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <ArrowLeftRight className="h-6 w-6 text-accent" />
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-headline">
              Vergelijk perspectieven
            </h1>
            <p className="mt-2 text-body font-body">
              Twee artikelen over dezelfde gebeurtenis, naast elkaar
            </p>
          </div>

          {/* Framing analysis */}
          <div className="mb-8 rounded-lg border border-divider bg-surface-warm p-5">
            <h2 className="mb-3 font-headline text-lg font-bold text-headline">
              Framing-analyse (koppen)
            </h2>
            <div className="grid gap-4 md:grid-cols-3 text-sm font-body">
              <div>
                <p className="font-semibold text-caption mb-1">Gedeelde woorden</p>
                <div className="flex flex-wrap gap-1">
                  {sharedWords.length > 0
                    ? sharedWords.map((w) => (
                        <span key={w} className="rounded bg-secondary px-2 py-0.5 text-xs">{w}</span>
                      ))
                    : <span className="text-caption text-xs">Geen</span>}
                </div>
              </div>
              {[
                { outlet: outletA, bias: biasA, words: uniqueA },
                { outlet: outletB, bias: biasB, words: uniqueB },
              ].map(({ outlet, bias, words }) => (
                <div key={outlet?.id ?? bias}>
                  <p className="font-semibold mb-1" style={{ color: `hsl(var(--bias-${bias}))` }}>
                    Uniek {outlet?.name ?? bias}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {words.map((w) => (
                      <span
                        key={w}
                        className="rounded px-2 py-0.5 text-xs text-primary-foreground"
                        style={{ backgroundColor: `hsl(var(--bias-${bias}))` }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side by side */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { article: articleA, outlet: outletA, bias: biasA },
              { article: articleB, outlet: outletB, bias: biasB },
            ].map(({ article, outlet, bias }) => (
              <div
                key={article.id}
                className="rounded-lg border-t-4 bg-card p-6"
                style={{ borderTopColor: `hsl(var(--bias-${bias}))` }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-caption">
                    {outlet?.name ?? article.outletId}
                  </span>
                  <BiasTag bias={bias} />
                </div>

                <h2 className="mb-4 font-headline text-xl font-bold text-headline leading-tight">
                  {article.headline}
                </h2>

                <div className="border-t border-divider pt-4">
                  {article.content.split("\n").map((para, i) =>
                    para.trim() ? (
                      <p key={i} className="mb-3 font-body text-sm text-body leading-relaxed">
                        {para}
                      </p>
                    ) : null
                  )}
                </div>

                <Link
                  to={`/artikel/${article.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-accent hover:text-accent/80 transition-colors font-body"
                >
                  Lees volledig artikel →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
