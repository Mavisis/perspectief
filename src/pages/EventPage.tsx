import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, getArticlesForEvent, getOutlet } from "@/lib/data";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { BiasBar, BiasTag } from "@/components/BiasIndicator";
import { IdeologicalCanvas } from "@/components/IdeologicalCanvas";
import { ArticlePopup } from "@/components/ArticlePopup";
import { BIAS_META } from "@/lib/types";
import type { Article } from "@/lib/types";
import { ArrowLeft, Calendar, CheckCircle, Scale, LayoutList, Compass } from "lucide-react";

type View = "articles" | "canvas";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const event = getEvent(id!);
  const [view, setView] = useState<View>("articles");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex flex-1 items-center justify-center py-20">
          <p className="text-lg text-muted-foreground font-body">Gebeurtenis niet gevonden.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const eventArticles = getArticlesForEvent(event.id);
  const biases = eventArticles.map((a) => getOutlet(a.outletId)!.bias);
  const uniqueBiases = [...new Set(biases)];

  const grouped = uniqueBiases.map((bias) => ({
    bias,
    articles: eventArticles.filter((a) => getOutlet(a.outletId)!.bias === bias),
  }));

  const comparisonPairs: [string, string][] = [];
  if (eventArticles.length >= 2) {
    comparisonPairs.push([eventArticles[0].id, eventArticles[1].id]);
    if (eventArticles.length >= 3) {
      comparisonPairs.push([eventArticles[0].id, eventArticles[eventArticles.length - 1].id]);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container py-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-caption font-body hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar overzicht
          </Link>

          {/* Event header */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm text-caption font-body">
              <Calendar className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString("nl-NL", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-headline md:text-4xl">
              {event.title}
            </h1>
            <p className="mt-3 max-w-2xl text-body font-body leading-relaxed">
              {event.summary}
            </p>

            <div className="mt-6 max-w-md">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-caption font-body">
                Bias-verdeling
              </p>
              <BiasBar biases={biases} className="mb-2" />
              <div className="flex flex-wrap gap-1.5">
                {uniqueBiases.map((b) => (
                  <BiasTag key={b} bias={b} />
                ))}
              </div>
            </div>
          </div>

          {/* View toggle */}
          <div className="mb-6 flex items-center gap-1 rounded-lg border border-divider bg-surface-warm p-1 w-fit">
            <button
              onClick={() => setView("articles")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-body font-medium transition-colors ${
                view === "articles"
                  ? "bg-card text-headline shadow-sm"
                  : "text-caption hover:text-foreground"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Perspectieven
            </button>
            <button
              onClick={() => setView("canvas")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-body font-medium transition-colors ${
                view === "canvas"
                  ? "bg-card text-headline shadow-sm"
                  : "text-caption hover:text-foreground"
              }`}
            >
              <Compass className="h-4 w-4" />
              Ideologisch canvas
            </button>
          </div>

          {/* Articles view */}
          {view === "articles" && (
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-6 font-headline text-xl font-bold text-headline">
                  Artikelen per perspectief
                </h2>

                <div className="space-y-8">
                  {grouped.map(({ bias, articles }) => (
                    <div key={bias}>
                      <div className="mb-3 flex items-center gap-2">
                        <BiasTag bias={bias} size="md" />
                        <span className="text-xs text-caption font-body">
                          {BIAS_META[bias].description}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {articles.map((article) => (
                          <ArticleCard key={article.id} article={article} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {comparisonPairs.length > 0 && (
                  <div className="mt-10 rounded-lg border border-divider bg-surface-warm p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-headline text-lg font-bold text-headline">
                      <Scale className="h-5 w-5 text-accent" />
                      Vergelijk perspectieven
                    </h3>
                    <div className="space-y-2">
                      {comparisonPairs.map(([a, b], i) => {
                        const artA = eventArticles.find((x) => x.id === a)!;
                        const artB = eventArticles.find((x) => x.id === b)!;
                        return (
                          <Link
                            key={i}
                            to={`/vergelijk/${a}/${b}`}
                            className="block rounded border border-divider bg-card p-3 text-sm font-body text-body hover:border-accent/40 transition-colors"
                          >
                            <span className="font-semibold">{getOutlet(artA.outletId)!.name}</span>
                            {" vs "}
                            <span className="font-semibold">{getOutlet(artB.outletId)!.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {event.sharedFacts && event.sharedFacts.length > 0 && (
                <aside>
                  <div className="sticky top-8 rounded-lg border border-divider bg-surface-cool p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold text-headline">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      Gedeelde feiten
                    </h3>
                    <p className="mb-4 text-xs text-caption font-body">
                      Feiten die in meerdere bronnen voorkomen:
                    </p>
                    <ul className="space-y-3">
                      {event.sharedFacts.map((fact, i) => (
                        <li key={i} className="flex gap-2 text-sm text-body font-body leading-relaxed">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* Canvas view */}
          {view === "canvas" && (
            <div className="space-y-3">
              <p className="text-sm text-caption font-body">
                Elk punt is een artikel. Klik om te lezen · sleep om te bewegen · scroll om in/uit te zoomen.
              </p>
              <div style={{ height: "560px" }}>
                <IdeologicalCanvas
                  articles={eventArticles}
                  onArticleClick={setSelectedArticle}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedArticle && (
        <ArticlePopup article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}
