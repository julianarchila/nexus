"use client";

import type {
  countryProcessorFeatures,
  paymentProcessors,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

type PaymentProcessor = typeof paymentProcessors.$inferSelect;
type CountryFeature = typeof countryProcessorFeatures.$inferSelect;

type CapabilityFilters = {
  payouts: boolean;
  recurring: boolean;
  refunds: boolean;
  crypto: boolean;
  local_instruments: boolean;
};

type DerivedSupport = {
  countries: string[];
  methods: string[];
  supports_local_instruments: boolean;
  supports_payouts: boolean;
  supports_crypto: boolean;
};

function uniqSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function intersect(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.some((v) => setB.has(v));
}

function renderBadges(items: string[], max = 3) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const shown = items.slice(0, max);
  const remaining = items.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
      {remaining > 0 ? (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      ) : null}
    </div>
  );
}

function getStatusBadge(status: string) {
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
}

function CapabilityCell({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
      {enabled ? "✓" : "—"}
    </span>
  );
}

export function PaymentProcessorsSupportTable() {
  const trpc = useTRPC();
  const pageSize = 10;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityFilters>({
    payouts: false,
    recurring: false,
    refunds: false,
    crypto: false,
    local_instruments: false,
  });

  const processorsQuery = useQuery({
    ...trpc.payments.getProcessors.queryOptions({}),
    staleTime: 1000 * 60 * 30,
  });

  const featuresQuery = useQuery({
    ...trpc.payments.getCountryFeatures.queryOptions({}),
    staleTime: 1000 * 60 * 30,
  });

  const allProcessors = processorsQuery.data ?? [];
  const allFeatures = featuresQuery.data ?? [];

  const featuresByProcessor = useMemo(() => {
    const map = new Map<string, CountryFeature[]>();
    for (const feature of allFeatures) {
      const arr = map.get(feature.processor_id) ?? [];
      arr.push(feature);
      map.set(feature.processor_id, arr);
    }
    return map;
  }, [allFeatures]);

  const allCountries = useMemo(() => {
    return uniqSorted(allFeatures.map((f) => f.country));
  }, [allFeatures]);

  const allMethods = useMemo(() => {
    const values: string[] = [];
    for (const f of allFeatures) {
      if (Array.isArray(f.supported_methods)) {
        values.push(...f.supported_methods);
      }
    }
    return uniqSorted(values);
  }, [allFeatures]);

  const derivedByProcessor = useMemo(() => {
    const map = new Map<string, DerivedSupport>();

    for (const processor of allProcessors) {
      const features = featuresByProcessor.get(processor.id) ?? [];
      const countries = uniqSorted(features.map((f) => f.country));
      const relevantFeatures =
        selectedCountries.length > 0
          ? features.filter((f) => selectedCountries.includes(f.country))
          : features;

      const methodValues: string[] = [];
      for (const f of relevantFeatures) {
        if (Array.isArray(f.supported_methods)) {
          methodValues.push(...f.supported_methods);
        }
      }
      const methods = uniqSorted(methodValues);

      const supports_local_instruments = relevantFeatures.some(
        (f) => f.supports_local_instruments,
      );

      const supports_payouts =
        processor.supports_payouts ||
        relevantFeatures.some((f) => f.supports_payouts);

      const supports_crypto =
        processor.supports_crypto || relevantFeatures.some((f) => f.supports_crypto);

      map.set(processor.id, {
        countries,
        methods,
        supports_local_instruments,
        supports_payouts,
        supports_crypto,
      });
    }

    return map;
  }, [allProcessors, featuresByProcessor, selectedCountries]);

  const activeFiltersCount =
    selectedCountries.length +
    selectedMethods.length +
    Object.values(capabilities).filter(Boolean).length;

  const { filteredProcessors, totalPages } = useMemo(() => {
    let filtered = allProcessors;

    // Filters: country
    if (selectedCountries.length > 0) {
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        return d ? intersect(d.countries, selectedCountries) : false;
      });
    }

    // Filters: payment methods (respect country filter via derived methods)
    if (selectedMethods.length > 0) {
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        return d ? intersect(d.methods, selectedMethods) : false;
      });
    }

    // Filters: capabilities
    filtered = filtered.filter((p) => {
      const d = derivedByProcessor.get(p.id);
      if (!d) return false;

      if (capabilities.payouts && !d.supports_payouts) return false;
      if (capabilities.recurring && !p.supports_recurring) return false;
      if (capabilities.refunds && !p.supports_refunds) return false;
      if (capabilities.crypto && !d.supports_crypto) return false;
      if (capabilities.local_instruments && !d.supports_local_instruments) return false;

      return true;
    });

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        const haystack = [
          p.name,
          p.id,
          p.status,
          p.product_manager ?? "",
          ...(d?.countries ?? []),
          ...(d?.methods ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    const total = Math.max(1, Math.ceil(filtered.length / pageSize));
    return { filteredProcessors: filtered, totalPages: total };
  }, [
    allProcessors,
    capabilities,
    derivedByProcessor,
    pageSize,
    search,
    selectedCountries,
    selectedMethods,
  ]);

  const processors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProcessors.slice(start, start + pageSize);
  }, [filteredProcessors, page, pageSize]);

  const isLoading = processorsQuery.isLoading || featuresQuery.isLoading;

  const toggleInList = (list: string[], value: string, nextChecked: boolean) => {
    if (nextChecked) return uniqSorted([...list, value]);
    return list.filter((v) => v !== value);
  };

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedMethods([]);
    setCapabilities({
      payouts: false,
      recurring: false,
      refunds: false,
      crypto: false,
      local_instruments: false,
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-[280px] sm:max-w-md">
          <Input
            placeholder="Search PSP, country, or payment method..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal />
                Filters
                {activeFiltersCount > 0 ? (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Country</DropdownMenuLabel>
              <DropdownMenuGroup>
                {allCountries.length === 0 ? (
                  <DropdownMenuItem disabled>No countries</DropdownMenuItem>
                ) : (
                  allCountries.map((country) => (
                    <DropdownMenuCheckboxItem
                      key={country}
                      checked={selectedCountries.includes(country)}
                      onCheckedChange={(checked) => {
                        const next = toggleInList(
                          selectedCountries,
                          country,
                          !!checked,
                        );
                        setSelectedCountries(next);
                        setPage(1);
                      }}
                    >
                      {country}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Payment methods</DropdownMenuLabel>
              <DropdownMenuGroup>
                {allMethods.length === 0 ? (
                  <DropdownMenuItem disabled>No payment methods</DropdownMenuItem>
                ) : (
                  allMethods.map((method) => (
                    <DropdownMenuCheckboxItem
                      key={method}
                      checked={selectedMethods.includes(method)}
                      onCheckedChange={(checked) => {
                        const next = toggleInList(
                          selectedMethods,
                          method,
                          !!checked,
                        );
                        setSelectedMethods(next);
                        setPage(1);
                      }}
                    >
                      {method}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Capabilities</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  checked={capabilities.payouts}
                  onCheckedChange={(checked) => {
                    setCapabilities((prev) => ({ ...prev, payouts: !!checked }));
                    setPage(1);
                  }}
                >
                  Payouts
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={capabilities.recurring}
                  onCheckedChange={(checked) => {
                    setCapabilities((prev) => ({ ...prev, recurring: !!checked }));
                    setPage(1);
                  }}
                >
                  Recurring
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={capabilities.refunds}
                  onCheckedChange={(checked) => {
                    setCapabilities((prev) => ({ ...prev, refunds: !!checked }));
                    setPage(1);
                  }}
                >
                  Refunds
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={capabilities.crypto}
                  onCheckedChange={(checked) => {
                    setCapabilities((prev) => ({ ...prev, crypto: !!checked }));
                    setPage(1);
                  }}
                >
                  Crypto
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={capabilities.local_instruments}
                  onCheckedChange={(checked) => {
                    setCapabilities((prev) => ({
                      ...prev,
                      local_instruments: !!checked,
                    }));
                    setPage(1);
                  }}
                >
                  Local instruments
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  clearFilters();
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg bg-white overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Processor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Payouts</TableHead>
              <TableHead className="font-semibold text-center">Recurring</TableHead>
              <TableHead className="font-semibold text-center">Refunds</TableHead>
              <TableHead className="font-semibold text-center">Crypto</TableHead>
              <TableHead className="font-semibold text-center">
                Local Inst.
              </TableHead>
              <TableHead className="font-semibold">Countries</TableHead>
              <TableHead className="font-semibold">Payment methods</TableHead>
              <TableHead className="font-semibold">PM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : processors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  No processors found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              processors.map((processor: PaymentProcessor) => {
                const d = derivedByProcessor.get(processor.id);
                const countries = d?.countries ?? [];
                const methods = d?.methods ?? [];

                return (
                  <TableRow
                    key={processor.id}
                    className="hover:bg-gray-50 last:border-0"
                  >
                    <TableCell>
                      <div className="font-medium">{processor.name}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {processor.id}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(processor.status)}</TableCell>
                    <TableCell className="text-center">
                      <CapabilityCell enabled={!!d?.supports_payouts} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CapabilityCell enabled={processor.supports_recurring} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CapabilityCell enabled={processor.supports_refunds} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CapabilityCell enabled={!!d?.supports_crypto} />
                    </TableCell>
                    <TableCell className="text-center">
                      <CapabilityCell enabled={!!d?.supports_local_instruments} />
                    </TableCell>
                    <TableCell>{renderBadges(countries, 3)}</TableCell>
                    <TableCell>{renderBadges(methods, 3)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {processor.product_manager || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{processors.length}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {filteredProcessors.length}
          </span>{" "}
          processors
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
