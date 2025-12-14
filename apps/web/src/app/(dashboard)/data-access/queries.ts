import { useTRPC } from "@/lib/trpc/client";

/**
 * Query options for merchants list
 * Pattern 1: Small dataset, client-side filtering
 */
export function useMerchantsQueryOptions() {
  const trpc = useTRPC();

  return {
    list: trpc.merchants.list.queryOptions(),
  };
}

// 5 minutes for dynamic merchant data
export const MERCHANTS_STALE_TIME = 1000 * 60 * 5;
