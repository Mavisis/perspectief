import { useState } from "react";
import { Search } from "lucide-react";
import { events, searchEvents } from "@/lib/data";
import { EventCard } from "@/components/EventCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [query, setQuery] = useState("");
  const filtered = query.trim() ? searchEvents(query) : events;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-divider bg-surface-warm">
          <div className="container py-16 text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-headline md:text-5xl">
              Elk verhaal heeft
              <br />
              <span className="text-accent">meerdere kanten</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-body font-body leading-relaxed">
              Perspectief groepeert Nederlands nieuws per gebeurtenis en toont
              hoe verschillende media hetzelfde event framen.
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-lg border border-divider bg-card px-4 py-2.5 shadow-sm focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <Search className="h-5 w-5 text-caption" />
              <input
                type="text"
                placeholder="Zoek naar een onderwerp…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-caption outline-none"
              />
            </div>
          </div>
        </section>

        {/* Events */}
        <section className="container py-12">
          <h2 className="mb-1 font-headline text-2xl font-bold text-headline">
            Recente gebeurtenissen
          </h2>
          <p className="mb-8 text-sm text-caption font-body">
            {filtered.length} gebeurtenis{filtered.length !== 1 && "sen"} gevonden
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((event, i) => (
              <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground font-body">
                Geen gebeurtenissen gevonden voor "{query}"
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
