import { useQuery } from "@tanstack/react-query";
import { api, type ApiArticle } from "@/lib/api";
import { getArticle, getOutlet } from "@/lib/data";

function mockArticle(id: string): ApiArticle | undefined {
  const article = getArticle(id);
  if (!article) return undefined;
  const outlet = getOutlet(article.outletId);
  return { ...article, outlet: outlet ?? undefined } as ApiArticle;
}

export function useArticle(id: string | undefined) {
  const query = useQuery<ApiArticle>({
    queryKey: ["article", id],
    queryFn: () => api.articles.get(id!),
    enabled: !!id,
    staleTime: 120_000,
    retry: 1,
  });

  return {
    ...query,
    article: query.data ?? (query.isError && id ? mockArticle(id) : undefined),
  };
}
