import { useParams, Link } from "react-router-dom";
import { getArticle, getOutlet, getEvent, getArticlesForEvent } from "@/lib/data";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BiasTag } from "@/components/BiasIndicator";
import { BIAS_META } from "@/lib/types";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const article = getArticle(id!);

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex flex-1 items-center justify-center py-20">
          <p className="text-lg text-muted-foreground font-body">Artikel niet gevonden.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const outlet = getOutlet(article.outletId)!;
  const event = getEvent(article.eventId)!;
  const totalArticles = getArticlesForEvent(event.id).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <Link
            to={`/gebeurtenis/${event.id}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-caption font-body hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar {event.title}
          </Link>

          {/* Context banner */}
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
            <div className="font-body text-sm text-body">
              <p className="font-semibold text-headline">
                Dit is 1 van {totalArticles} perspectieven op deze gebeurtenis
              </p>
              <p className="mt-1 text-caption">
                Elk medium kiest een eigen invalshoek. Lees ook de{" "}
                <Link to={`/gebeurtenis/${event.id}`} className="underline text-accent hover:text-accent/80">
                  andere perspectieven
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Article header */}
          <div className="mb-6 flex items-center gap-3">
            <span className="font-body text-sm font-semibold uppercase tracking-wider text-caption">
              {outlet.name}
            </span>
            <BiasTag bias={outlet.bias} size="md" />
          </div>

          <p className="mb-1 text-xs text-caption font-body">
            {BIAS_META[outlet.bias].description}
          </p>

          <h1 className="mt-4 font-headline text-3xl font-extrabold leading-tight text-headline md:text-4xl">
            {article.headline}
          </h1>

          <p className="mt-2 text-sm text-caption font-body">
            {new Date(article.publishedAt).toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div
            className="mt-8 border-t border-divider pt-8"
            style={{ borderLeftColor: `hsl(var(--bias-${outlet.bias}))` }}
          >
            {article.content.split("\n").map((para, i) =>
              para.trim() ? (
                <p key={i} className="mb-4 font-body text-body leading-relaxed text-base">
                  {para}
                </p>
              ) : null
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
