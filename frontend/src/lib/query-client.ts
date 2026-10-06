import { QueryClient } from "@tanstack/react-query";
import { isPrivateQueryKey } from "@/lib/query-keys";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const removePrivateQueries = (client: QueryClient): void => {
  client.removeQueries({
    predicate: (query) => isPrivateQueryKey(query.queryKey),
  });
};
