# Data Access Patterns

This document outlines the standard patterns for accessing data in the Nexus application.

## Architecture Overview

We use **tRPC** for all client-server communication with **TanStack Query** (React Query) for client-side caching and state management.

### Technology Stack

- **tRPC v11**: Type-safe API layer
- **TanStack Query v5**: Data fetching and caching
- **Drizzle ORM**: Database queries
- **PostgreSQL**: Database

---

## Pattern 1: Static Reference Data (Recommended for Small Datasets)

Use this pattern when:
- The data doesn't change frequently
- The dataset is small (< 1000 records)
- You need client-side filtering, searching, or sorting
- Examples: payment processors, countries, payment methods, feature flags

### Implementation

#### 1. Define tRPC Procedure

In `apps/web/src/lib/trpc/router.ts`:

```typescript
import { db } from "@/core/db/client";
import { paymentProcessors } from "@/core/db/schema";
import { publicProcedure, router } from "./init";
import { z } from "zod";

export const appRouter = router({
  payments: router({
    getProcessors: publicProcedure
      .input(z.object({}))
      .query(async () => {
        // Fetch all data at once
        const processors = await db.select().from(paymentProcessors);
        return processors;
      }),
  }),
});
```

#### 2. Create Query Options Hook (Optional but Recommended)

In `apps/web/src/app/[feature]/data-access/queries.ts`:

```typescript
import { useTRPC } from "@/lib/trpc/client";

export function usePaymentProcessorsQueryOptions() {
  const trpc = useTRPC();

  return {
    processors: trpc.payments.getProcessors.queryOptions({}),
  };
}

export const QUERY_STALE_TIME = 1000 * 60 * 60; // 1 hour
```

#### 3. Use in Component/Hook

In `apps/web/src/app/[feature]/hooks/use-data.ts` or directly in components:

```typescript
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

const STALE_TIME = 1000 * 60 * 60; // 1 hour

export function usePaymentProcessors() {
  const trpc = useTRPC();

  // Fetch all data with long cache time
  const processorsQuery = useQuery({
    ...trpc.payments.getProcessors.queryOptions({}),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME, // Previously cacheTime
  });

  const allProcessors = processorsQuery.data ?? [];
  const isLoading = processorsQuery.isLoading;

  // Apply filters/sorting on the client
  const filteredProcessors = useMemo(() => {
    return allProcessors.filter(/* your filter logic */);
  }, [allProcessors]);

  return {
    processors: filteredProcessors,
    isLoading,
  };
}
```

### Benefits

✅ **Instant filtering/sorting** - No server round-trips  
✅ **Reduced server load** - Data cached for 1 hour  
✅ **Type-safe** - Full TypeScript support  
✅ **Offline-friendly** - Works with cached data  
✅ **Simple** - No pagination complexity  

### Cache Configuration

```typescript
{
  staleTime: 1000 * 60 * 60, // 1 hour - how long data is considered fresh
  gcTime: 1000 * 60 * 60,    // 1 hour - how long unused data stays in cache
  refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  refetchOnReconnect: false,   // Optional: prevent refetch on reconnect
}
```

---

## Pattern 2: Server-Side Pagination (For Large Datasets)

Use this pattern when:
- The dataset is large (> 1000 records)
- You need server-side filtering/sorting
- Examples: audit logs, transaction history, large merchant lists

### Implementation

#### 1. Define tRPC Procedure with Pagination

```typescript
const getPaginatedInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
});

export const appRouter = router({
  transactions: router({
    list: publicProcedure
      .input(getPaginatedInput)
      .query(async ({ input }) => {
        const { page, pageSize, search } = input;
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const conditions = [];
        if (search) {
          conditions.push(like(transactions.description, `%${search}%`));
        }

        // Get total count
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Get paginated data
        const data = await db
          .select()
          .from(transactions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .limit(pageSize)
          .offset(offset);

        return {
          data,
          pagination: {
            page,
            pageSize,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / pageSize),
          },
        };
      }),
  }),
});
```

#### 2. Use in Component

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useTransactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.transactions.list.queryOptions({ page, pageSize: 20, search }),
    staleTime: 1000 * 60 * 5, // 5 minutes for dynamic data
  });

  return {
    transactions: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    setPage,
    setSearch,
  };
}
```

---

## Pattern 3: Mutations (Create, Update, Delete)

Use mutations for any data-modifying operations.

### Implementation

#### 1. Define tRPC Mutation

```typescript
const updateProcessorInput = z.object({
  id: z.string(),
  name: z.string().optional(),
  status: z.enum(["NOT_SUPPORTED", "IN_PROGRESS", "LIVE", "DEPRECATED"]).optional(),
});

export const appRouter = router({
  payments: router({
    updateProcessor: publicProcedure
      .input(updateProcessorInput)
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;

        const [updated] = await db
          .update(paymentProcessors)
          .set(updates)
          .where(eq(paymentProcessors.id, id))
          .returning();

        return updated;
      }),
  }),
});
```

#### 2. Use in Component

```typescript
"use client";

import { useTRPC } from "@/lib/trpc/client";

export function ProcessorSettings() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  const updateMutation = trpc.payments.updateProcessor.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.payments.getProcessors.invalidate();
    },
  });

  const handleUpdate = async (id: string, status: string) => {
    await updateMutation.mutateAsync({ id, status });
  };

  return (
    <button
      onClick={() => handleUpdate("stripe", "LIVE")}
      disabled={updateMutation.isPending}
    >
      {updateMutation.isPending ? "Updating..." : "Update"}
    </button>
  );
}
```

---

## Pattern 4: Real-Time Data (Optional)

For data that changes frequently and needs real-time updates, consider:

1. **Polling** - Using `refetchInterval`
2. **WebSockets** - Using tRPC subscriptions
3. **Server-Sent Events** - For one-way updates

```typescript
// Polling example
const query = useQuery({
  ...trpc.dashboard.stats.queryOptions(),
  refetchInterval: 5000, // Refetch every 5 seconds
});
```

---

## Best Practices

### DO ✅

- **Use tRPC for all client-server communication** - No server actions, no REST endpoints
- **Cache reference data for 1 hour** - Payment processors, countries, etc.
- **Cache dynamic data for 5 minutes** - User-specific or frequently changing data
- **Type your data** - Use Drizzle's `$inferSelect` for type inference
- **Handle loading states** - Always show loading UI
- **Handle errors** - Use `isError` and `error` from queries
- **Invalidate caches** - After mutations, invalidate related queries
- **Use query options** - For reusable query configurations
- **Organize by feature** - Keep queries, hooks, and components together

```
apps/web/src/app/[feature]/
├── components/
├── hooks/
├── data-access/
│   └── queries.ts
└── page.tsx
```

### DON'T ❌

- **Don't use Next.js server actions** - Use tRPC instead
- **Don't fetch data in server components** - Use client components with tRPC
- **Don't over-cache dynamic data** - Use shorter stale times for frequently changing data
- **Don't fetch on every render** - Let TanStack Query handle caching
- **Don't ignore TypeScript errors** - Fix them immediately
- **Don't skip error handling** - Always handle loading and error states
- **Don't bypass the cache** - Use `invalidate()` instead of `refetch()`
- **Don't mix patterns** - Be consistent within a feature

---

## Cache Invalidation

### After Mutations

```typescript
const utils = trpc.useUtils();

// Invalidate specific query
utils.payments.getProcessors.invalidate();

// Invalidate all queries in a router
utils.payments.invalidate();

// Refetch specific query
utils.payments.getProcessors.refetch();
```

### Manual Invalidation

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate all queries
queryClient.invalidateQueries();

// Invalidate queries with a specific key
queryClient.invalidateQueries({ queryKey: ["payments"] });
```

---

## Error Handling

### In Queries

```typescript
const query = useQuery({
  ...trpc.payments.getProcessors.queryOptions({}),
  retry: 3, // Retry failed requests 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (query.isError) {
  return <ErrorMessage error={query.error} />;
}
```

### In Mutations

```typescript
const mutation = trpc.payments.updateProcessor.useMutation({
  onError: (error) => {
    toast.error(`Failed to update: ${error.message}`);
  },
  onSuccess: (data) => {
    toast.success("Updated successfully");
  },
});
```

---

## Type Safety

### Inferring Types from tRPC

```typescript
import type { AppRouter } from "@/lib/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Processors = RouterOutput["payments"]["getProcessors"];
```

### Using Drizzle Types

```typescript
import type { paymentProcessors } from "@/core/db/schema";

type PaymentProcessor = typeof paymentProcessors.$inferSelect;
type NewPaymentProcessor = typeof paymentProcessors.$inferInsert;
```

---

## Testing

### Mock tRPC Queries

```typescript
import { createTRPCMsw } from "msw-trpc";
import { AppRouter } from "@/lib/trpc/router";

const trpcMsw = createTRPCMsw<AppRouter>();

const handlers = [
  trpcMsw.payments.getProcessors.query(() => {
    return [
      { id: "stripe", name: "Stripe", status: "LIVE" },
      { id: "adyen", name: "Adyen", status: "LIVE" },
    ];
  }),
];
```

---

## Performance Tips

1. **Use `select` to transform data** - Reduce re-renders
```typescript
const names = useQuery({
  ...trpc.payments.getProcessors.queryOptions({}),
  select: (data) => data.map((p) => p.name),
});
```

2. **Enable query deduplication** - Automatic in TanStack Query v5

3. **Use `keepPreviousData`** - For pagination
```typescript
const query = useQuery({
  ...trpc.transactions.list.queryOptions({ page }),
  placeholderData: keepPreviousData,
});
```

4. **Prefetch data** - For anticipated navigation
```typescript
const utils = trpc.useUtils();

const prefetchNextPage = () => {
  utils.transactions.list.prefetch({ page: currentPage + 1 });
};
```

---

## Migration from Server Actions

If you have existing server actions, migrate them to tRPC:

### Before (Server Actions)
```typescript
"use server";

export async function getProcessors() {
  const processors = await db.select().from(paymentProcessors);
  return processors;
}
```

### After (tRPC)
```typescript
// In router.ts
getProcessors: publicProcedure
  .input(z.object({}))
  .query(async () => {
    const processors = await db.select().from(paymentProcessors);
    return processors;
  }),

// In component
const query = useQuery({
  ...trpc.payments.getProcessors.queryOptions({}),
});
```

---

## Summary

- **Always use tRPC** for client-server communication
- **Cache reference data for 1 hour** using TanStack Query
- **Do client-side filtering** for small datasets
- **Do server-side pagination** for large datasets
- **Invalidate caches** after mutations
- **Handle errors gracefully** in all queries and mutations
- **Keep it type-safe** with TypeScript and Drizzle

For questions or clarifications, refer to:
- [tRPC Documentation](https://trpc.io)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
