# Data Access Patterns Migration

**Date:** December 14, 2024  
**Status:** ✅ Completed

## Summary

Successfully migrated the application from Next.js server actions to **tRPC + TanStack Query** for all data fetching and established standardized data access patterns for consistency going forward.

## What Changed

### 1. Removed Server Actions

**Deleted:** `apps/web/src/core/actions/payments.ts`

- This file was attempting to implement server actions for fetching payment processors and country features
- Server actions added unnecessary complexity and were replaced with tRPC

### 2. Updated Payment Components

**Modified:** `apps/web/src/components/payments.tsx`

- **Before:** Used server actions (`getPaymentProcessors`, `getCountryProcessorFeatures`)
- **After:** Uses tRPC with TanStack Query
- Implements client-side filtering and pagination
- Caches data for 1 hour to reduce server load

### 3. Architecture

The new pattern follows:
```
tRPC Procedure → queryOptions() → useQuery() → useMemo() → UI
```

**Key Pattern:**
```typescript
// 1. Define tRPC procedure in router.ts
getProcessors: publicProcedure
  .input(z.object({}))
  .query(async () => {
    return await db.select().from(paymentProcessors);
  }),

// 2. Use with TanStack Query
const processorsQuery = useQuery({
  ...trpc.payments.getProcessors.queryOptions({}),
  staleTime: 1000 * 60 * 60, // 1 hour
});

// 3. Apply filters on client
const filtered = useMemo(() => {
  return allProcessors.filter(/* logic */);
}, [allProcessors]);
```

## Implementation Details

### Payment Processors Table (`ProcessorsTable`)
- Fetches all payment processors at once
- Caches for 1 hour
- Client-side filtering by status and search
- Client-side pagination (10 items per page)
- Status: ✅ Complete

### Country Features Table (`CountryFeaturesTable`)
- Fetches all country processor features at once
- Caches for 1 hour
- Client-side filtering by search term
- Client-side pagination (10 items per page)
- Status: ✅ Complete

### Dashboard Tabs Component (`DashboardTabs`)
- Combines both tables in a tabbed interface
- No need to pass initial data anymore
- Status: ✅ Complete

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Type Safety** | Full end-to-end type checking with tRPC |
| **Consistency** | Same pattern used across codebase |
| **Performance** | 1-hour client-side caching reduces API calls |
| **UX** | Instant filtering/sorting with no server round-trips |
| **Maintainability** | Clear separation of concerns |
| **Scalability** | Framework for server-side pagination when needed |

## Documentation

Created comprehensive guide: **`docs/data-access-patterns.md`**

Includes:
- ✅ 4 data access patterns with examples
- ✅ Best practices and anti-patterns
- ✅ Type safety strategies
- ✅ Cache invalidation techniques
- ✅ Error handling approaches
- ✅ Testing strategies
- ✅ Migration guide from server actions
- ✅ Performance optimization tips

## TypeScript Status

```bash
✓ Type check passed successfully
```

All type errors resolved. The application now passes strict TypeScript checking.

## File Structure

```
apps/web/src/
├── components/
│   └── payments.tsx                    # Updated to use tRPC
├── lib/trpc/
│   ├── router.ts                       # tRPC router with procedures
│   ├── client.tsx                      # tRPC client setup
│   └── init.ts                         # tRPC initialization
└── app/payment-processors/
    ├── data-access/
    │   └── queries.ts                  # Query options factory
    └── hooks/
        └── use-payment-processors-data.ts  # Data fetching hook

docs/
├── context.md                          # Project context
├── ingestion-system-design.md          # Ingestion architecture
└── data-access-patterns.md             # ⭐ NEW: Standardized patterns
```

## Key Design Decisions

1. **Fetch All Data at Once**: For small datasets (< 1000 records), fetch everything and apply filtering on the client. This is simpler and provides instant UX.

2. **Client-Side Filtering**: Payment processors and country features are reference data that don't change often. Filtering on the client eliminates server round-trips.

3. **1-Hour Cache**: Balances freshness with server load reduction. Can be adjusted per feature.

4. **No Server Actions**: Standardized on tRPC for all client-server communication instead of mixing patterns.

5. **Query Options Pattern**: Using `queryOptions()` allows reusing queries across different components and enables prefetching.

## Migration Path for Future Features

When building new features:

1. Define tRPC procedure in `apps/web/src/lib/trpc/router.ts`
2. Create query options factory in `apps/web/[feature]/data-access/queries.ts` 
3. Use in components with `useQuery()` from `@tanstack/react-query`
4. Apply filtering/sorting on client or server based on data size
5. Handle loading and error states
6. Invalidate caches after mutations

## Testing

Components use:
- `useQuery` from `@tanstack/react-query` for data fetching
- `useMemo` for computed values
- `useState` for local state
- No async/await in components - all handled by tRPC

## Next Steps

1. ✅ Document patterns (DONE)
2. ✅ Apply to payments component (DONE)
3. Consider: Apply same pattern to other data-fetching components
4. Consider: Add mutation examples for create/update/delete operations
5. Consider: Implement real-time subscriptions if needed (WebSockets)

## Related Documentation

See `docs/data-access-patterns.md` for:
- Complete pattern reference
- Code examples for all scenarios
- Troubleshooting guide
- Performance optimization tips
