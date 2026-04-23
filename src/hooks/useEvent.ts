import { useQuery } from "@tanstack/react-query";
import { api, type ApiEvent } from "@/lib/api";
import { getEvent, getArticlesForEvent, getOutlet } from "@/lib/data";
import type { Article } from "@/lib/types";

function mockEventDetail(id: string): ApiEvent | undefined {
  const event = getEvent(id);
  if (!event) return undefined;
  const articles = getArticlesForEvent(id).map((a) => {
    const outlet = getOutlet(a.outletId);
    return { ...a, outlet: outlet ?? undefined } as Article & { outlet?: typeof outlet };
  });
  return { ...event, articles } as ApiEvent;
}

export function useEvent(id: string | undefined) {
  const query = useQuery<ApiEvent>({
    queryKey: ["event", id],
    queryFn: () => api.events.get(id!),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1,
  });

  return {
    ...query,
    event: query.data ?? (query.isError && id ? mockEventDetail(id) : undefined),
  };
}
