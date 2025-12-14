import { useTRPC } from "@/lib/trpc/client";

export function usePaymentProcessorsQueryOptions() {
  const trpc = useTRPC();

  return {
    processors: trpc.payments.getProcessors.queryOptions({}),
    countryFeatures: trpc.payments.getCountryFeatures.queryOptions({}),
  };
}

export const QUERY_STALE_TIME = 1000 * 60 * 30; // 30 minutes
