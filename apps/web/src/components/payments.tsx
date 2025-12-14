"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  countryProcessorFeatures,
  paymentProcessors,
} from "@/core/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/lib/trpc/client";

type PaymentProcessor = typeof paymentProcessors.$inferSelect;
type CountryFeature = typeof countryProcessorFeatures.$inferSelect;

const STALE_TIME = 1000 * 60 * 60; // 1 hour

export function ProcessorsTable() {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const trpc = useTRPC();

  // Fetch all processors with 1 hour cache
  const processorsQuery = useQuery({
    ...trpc.payments.getProcessors.queryOptions({}),
    staleTime: STALE_TIME,
  });

  const allProcessors = processorsQuery.data ?? [];
  const isLoading = processorsQuery.isLoading;

  // Client-side filtering and pagination
  const { filteredProcessors, pagination } = useMemo(() => {
    let filtered: PaymentProcessor[] = allProcessors;

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(
        (p: PaymentProcessor) => p.status === filters.status,
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p: PaymentProcessor) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.id.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    return {
      filteredProcessors: paginatedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }, [allProcessors, filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline"
          | "success"
          | "warning";
      }
    > = {
      NOT_SUPPORTED: { label: "Not Supported", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "warning" },
      LIVE: { label: "Live", variant: "success" },
      DEPRECATED: { label: "Deprecated", variant: "destructive" },
    };
    const config = statusMap[status] || statusMap.NOT_SUPPORTED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[280px]">
          <Input
            placeholder="Search by name or ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="h-9"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All statuses</option>
          <option value="NOT_SUPPORTED">Not Supported</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="LIVE">Live</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">
                Payouts
              </TableHead>
              <TableHead className="font-semibold text-center">
                Recurring
              </TableHead>
              <TableHead className="font-semibold text-center">
                Refunds
              </TableHead>
              <TableHead className="font-semibold text-center">
                Crypto
              </TableHead>
              <TableHead className="font-semibold">PM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcessors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No processors found
                </TableCell>
              </TableRow>
            ) : (
              filteredProcessors.map((processor: PaymentProcessor) => (
                <TableRow
                  key={processor.id}
                  className="hover:bg-gray-50 last:border-0"
                >
                  <TableCell className="font-medium">
                    {processor.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {processor.id}
                  </TableCell>
                  <TableCell>{getStatusBadge(processor.status)}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        processor.supports_payouts
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {processor.supports_payouts ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        processor.supports_recurring
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {processor.supports_recurring ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        processor.supports_refunds
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {processor.supports_refunds ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        processor.supports_crypto
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {processor.supports_crypto ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {processor.product_manager || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredProcessors.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {pagination.total}
          </span>{" "}
          processors
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CountryFeaturesTable() {
  const [filters, setFilters] = useState({ search: "" });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const trpc = useTRPC();

  // Fetch all country features with 1 hour cache
  const featuresQuery = useQuery({
    ...trpc.payments.getCountryFeatures.queryOptions({}),
    staleTime: STALE_TIME,
  });

  const allFeatures = featuresQuery.data ?? [];
  const isLoading = featuresQuery.isLoading;

  // Client-side filtering and pagination
  const { filteredFeatures, pagination } = useMemo(() => {
    let filtered: CountryFeature[] = allFeatures;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (f: CountryFeature) =>
          f.country.toLowerCase().includes(searchLower) ||
          f.processor_id.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    return {
      filteredFeatures: paginatedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }, [allFeatures, filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline"
          | "success"
          | "warning";
      }
    > = {
      NOT_SUPPORTED: { label: "Not Supported", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "warning" },
      LIVE: { label: "Live", variant: "success" },
    };
    const config = statusMap[status] || statusMap.NOT_SUPPORTED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[280px]">
          <Input
            placeholder="Search by country or processor ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Country</TableHead>
              <TableHead className="font-semibold">Processor ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">
                Local Inst.
              </TableHead>
              <TableHead className="font-semibold text-center">
                Payouts
              </TableHead>
              <TableHead className="font-semibold text-center">
                Crypto
              </TableHead>
              <TableHead className="font-semibold">Payment Methods</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No features found
                </TableCell>
              </TableRow>
            ) : (
              filteredFeatures.map((feature: CountryFeature) => (
                <TableRow
                  key={feature.id}
                  className="hover:bg-gray-50 last:border-0"
                >
                  <TableCell className="font-medium">
                    {feature.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {feature.processor_id}
                  </TableCell>
                  <TableCell>{getStatusBadge(feature.status)}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        feature.supports_local_instruments
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {feature.supports_local_instruments ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        feature.supports_payouts
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {feature.supports_payouts ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        feature.supports_crypto
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {feature.supports_crypto ? "✓" : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {feature.supported_methods &&
                      feature.supported_methods.length > 0 ? (
                        <>
                          {feature.supported_methods
                            .slice(0, 3)
                            .map((method: string, idx: number) => (
                              <Badge
                                key={`${feature.id}-${method}-${idx}`}
                                variant="secondary"
                                className="text-xs"
                              >
                                {method}
                              </Badge>
                            ))}
                          {feature.supported_methods.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{feature.supported_methods.length - 3}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredFeatures.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {pagination.total}
          </span>{" "}
          features
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardTabs() {
  return (
    <Tabs defaultValue="processors" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="processors">Payment Processors</TabsTrigger>
        <TabsTrigger value="features">Country-Specific Features</TabsTrigger>
      </TabsList>
      <TabsContent value="processors" className="mt-6">
        <ProcessorsTable />
      </TabsContent>
      <TabsContent value="features" className="mt-6">
        <CountryFeaturesTable />
      </TabsContent>
    </Tabs>
  );
}
