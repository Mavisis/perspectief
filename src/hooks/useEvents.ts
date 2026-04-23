import { useQuery } from "@tanstack/react-query";
import { api, type ApiEvent } from "@/lib/api";
import { events as mockEvents } from "@/lib/data";

export function useEvents() {
  const query = useQuery<ApiEvent[]>({
    queryKey: ["events"],
    queryFn: api.events.list,
    staleTime: 60_000,
    retry: 1,
  });

  return {
    ...query,
    // Fall back to static mock data when API is unavailable
    events: (query.data ?? (query.isError ? (mockEvents as ApiEvent[]) : undefined)) as ApiEvent[] | undefined,
  };
}
