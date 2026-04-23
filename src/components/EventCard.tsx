import { Link } from "react-router-dom";
import type { NewsEvent } from "@/lib/types";
import { getArticlesForEvent, getOutlet } from "@/lib/data";
import { BiasBar, BiasTag } from "@/components/BiasIndicator";
import { Calendar, Newspaper } from "lucide-react";

interface EventCardProps {
  event: NewsEvent;
}

export function EventCard({ event }: EventCardProps) {
  const eventArticles = getArticlesForEvent(event.id);
  const biases = eventArticles.map((a) => getOutlet(a.outletId)!.bias);

  return (
    <Link
      to={`/gebeurtenis/${event.id}`}
      className="group block rounded-lg border border-divider bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-3 text-xs text-caption font-body">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(event.date).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Newspaper className="h-3.5 w-3.5" />
          {eventArticles.length} artikel{eventArticles.length !== 1 && "en"}
        </span>
      </div>

      <h2 className="mb-2 font-headline text-xl font-bold text-headline leading-tight group-hover:text-accent transition-colors">
        {event.title}
      </h2>

      <p className="mb-4 text-sm text-body font-body leading-relaxed line-clamp-2">
        {event.summary}
      </p>

      <BiasBar biases={biases} className="mb-3" />

      <div className="flex flex-wrap gap-1.5">
        {biases.map((bias, i) => (
          <BiasTag key={i} bias={bias} size="sm" />
        ))}
      </div>
    </Link>
  );
}
