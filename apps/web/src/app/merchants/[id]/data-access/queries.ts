import { useTRPC } from "@/lib/trpc/client";

/**
 * Query options for merchant detail page
 */
export function useMerchantQueryOptions(merchantId: string) {
  const trpc = useTRPC();

  return {
    merchant: trpc.merchants.getById.queryOptions(merchantId),
    attachments: trpc.attachments.getByMerchantId.queryOptions(merchantId),
  };
}

/**
 * Query options for pipeline readiness data
 */
export function usePipelineQueryOptions(merchantId: string) {
  const trpc = useTRPC();

  return {
    scopeReadiness: trpc.pipeline.getScopeReadiness.queryOptions(merchantId),
    implementationReadiness:
      trpc.pipeline.getImplementationReadiness.queryOptions(merchantId),
  };
}

/**
 * Query options for audit log with pagination
 * Pattern 2: Server-side pagination for large datasets
 */
export function useAuditLogQueryOptions(
  merchantId: string,
  page: number,
  actorType?: "AI" | "USER" | "SYSTEM",
) {
  const trpc = useTRPC();

  return {
    auditLog: trpc.auditLog.getByMerchantId.queryOptions({
      merchantId,
      page,
      pageSize: 20,
      actorType,
    }),
  };
}

/**
 * Query options for inbound events
 * Pattern 1: Small dataset per merchant, client-side filtering
 */
export function useEventsQueryOptions(merchantId: string) {
  const trpc = useTRPC();

  return {
    events: trpc.inboundEvents.getByMerchantId.queryOptions({
      merchantId,
    }),
  };
}

/**
 * Query options for semantic search
 * Pattern 3: Server-side semantic search
 */
export function useEventSearchQueryOptions(merchantId: string, query: string) {
  const trpc = useTRPC();

  return {
    search: trpc.inboundEvents.search.queryOptions(
      {
        merchantId,
        query,
      },
      {
        enabled: query.trim().length > 0,
      },
    ),
  };
}

// 5 minutes for merchant data
export const MERCHANT_STALE_TIME = 1000 * 60 * 5;

// 2 minutes for audit log (more dynamic)
export const AUDIT_LOG_STALE_TIME = 1000 * 60 * 2;

// 2 minutes for events (same as audit log)
export const EVENTS_STALE_TIME = 1000 * 60 * 2;
