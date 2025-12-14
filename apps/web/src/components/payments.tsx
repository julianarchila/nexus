"use client";

import type {
  paymentProcessors,
  countryProcessorFeatures,
} from "@/core/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useTransition } from "react";
import {
  getPaymentProcessors,
  getCountryProcessorFeatures,
} from "@/core/actions/payments";

type PaymentProcessor = typeof paymentProcessors.$inferSelect;
type CountryFeature = typeof countryProcessorFeatures.$inferSelect;

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ProcessorsTableProps {
  initialData: PaymentProcessor[];
  initialPagination: PaginationInfo;
}

export function ProcessorsTable({
  initialData,
  initialPagination,
}: ProcessorsTableProps) {
  const [processors, setProcessors] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [isPending, startTransition] = useTransition();

  const fetchData = (page: number) => {
    startTransition(async () => {
      const result = await getPaymentProcessors({
        page,
        pageSize: pagination.pageSize,
        ...filters,
      });
      if (result.success && result.data) {
        setProcessors(result.data);
        setPagination(result.pagination!);
      }
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const result = await getPaymentProcessors({
        page: 1,
        pageSize: pagination.pageSize,
        ...filters,
        [key]: value,
      });
      if (result.success && result.data) {
        setProcessors(result.data);
        setPagination(result.pagination!);
      }
    });
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
            {processors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No processors found
                </TableCell>
              </TableRow>
            ) : (
              processors.map((processor) => (
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
            {processors.length}
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
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1 || isPending}
          >
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isPending}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CountryFeaturesTableProps {
  initialData: CountryFeature[];
  initialPagination: PaginationInfo;
}

export function CountryFeaturesTable({
  initialData,
  initialPagination,
}: CountryFeaturesTableProps) {
  const [features, setFeatures] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [filters, setFilters] = useState({ search: "" });
  const [isPending, startTransition] = useTransition();

  const fetchData = (page: number) => {
    startTransition(async () => {
      const result = await getCountryProcessorFeatures({
        page,
        pageSize: pagination.pageSize,
        ...filters,
      });
      if (result.success && result.data) {
        setFeatures(result.data);
        setPagination(result.pagination!);
      }
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const result = await getCountryProcessorFeatures({
        page: 1,
        pageSize: pagination.pageSize,
        ...filters,
        [key]: value,
      });
      if (result.success && result.data) {
        setFeatures(result.data);
        setPagination(result.pagination!);
      }
    });
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
            {features.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No features found
                </TableCell>
              </TableRow>
            ) : (
              features.map((feature) => (
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
                            .map((method, idx) => (
                              <Badge
                                key={idx}
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
          <span className="font-medium text-foreground">{features.length}</span>{" "}
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
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1 || isPending}
          >
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isPending}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
interface DashboardTabsProps {
  processorsData: PaymentProcessor[];
  processorsPagination: PaginationInfo;
  featuresData: CountryFeature[];
  featuresPagination: PaginationInfo;
}

export function DashboardTabs({
  processorsData,
  processorsPagination,
  featuresData,
  featuresPagination,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="processors" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="processors">Payment Processors</TabsTrigger>
        <TabsTrigger value="features">Country-Specific Features</TabsTrigger>
      </TabsList>
      <TabsContent value="processors" className="mt-6">
        <ProcessorsTable
          initialData={processorsData}
          initialPagination={processorsPagination}
        />
      </TabsContent>
      <TabsContent value="features" className="mt-6">
        <CountryFeaturesTable
          initialData={featuresData}
          initialPagination={featuresPagination}
        />
      </TabsContent>
    </Tabs>
  );
}
