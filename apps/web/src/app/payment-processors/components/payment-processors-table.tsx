"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SlidersHorizontal } from "lucide-react";
import type { PaymentProcessor, DerivedSupport } from "../hooks/use-payment-processors-data";
import type {
  PaymentProcessorsFilters,
  CapabilityFilters,
} from "../hooks/use-payment-processors-filters";

// ----- Presentation Helpers -----

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
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
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
    <span
      className={
        enabled
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground"
      }
    >
      {enabled ? "✓" : "—"}
    </span>
  );
}

// ----- Sub-components -----

type FiltersDropdownProps = {
  allCountries: string[];
  allMethods: string[];
  filters: PaymentProcessorsFilters;
};

function FiltersDropdown({
  allCountries,
  allMethods,
  filters,
}: FiltersDropdownProps) {
  const {
    selectedCountries,
    selectedMethods,
    capabilities,
    activeFiltersCount,
    toggleCountry,
    toggleMethod,
    toggleCapability,
    clearFilters,
  } = filters;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
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
                onCheckedChange={(checked) => toggleCountry(country, !!checked)}
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
                onCheckedChange={(checked) => toggleMethod(method, !!checked)}
              >
                {method}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Capabilities</DropdownMenuLabel>
        <DropdownMenuGroup>
          {(
            [
              ["payouts", "Payouts"],
              ["recurring", "Recurring"],
              ["refunds", "Refunds"],
              ["crypto", "Crypto"],
              ["local_instruments", "Local instruments"],
            ] as const
          ).map(([key, label]) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={capabilities[key]}
              onCheckedChange={(checked) => toggleCapability(key, !!checked)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}
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
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  displayedCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  displayedCount,
  totalCount,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">{displayedCount}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        processors
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ----- Main Table Component -----

type ProcessorRowProps = {
  processor: PaymentProcessor;
  derived: DerivedSupport | undefined;
};

function ProcessorRow({ processor, derived }: ProcessorRowProps) {
  const countries = derived?.countries ?? [];
  const methods = derived?.methods ?? [];

  return (
    <TableRow className="hover:bg-gray-50 last:border-0">
      <TableCell>
        <div className="font-medium">{processor.name}</div>
        <div className="text-muted-foreground font-mono text-xs">
          {processor.id}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(processor.status)}</TableCell>
      <TableCell className="text-center">
        <CapabilityCell enabled={!!derived?.supports_payouts} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityCell enabled={processor.supports_recurring} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityCell enabled={processor.supports_refunds} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityCell enabled={!!derived?.supports_crypto} />
      </TableCell>
      <TableCell className="text-center">
        <CapabilityCell enabled={!!derived?.supports_local_instruments} />
      </TableCell>
      <TableCell>{renderBadges(countries, 3)}</TableCell>
      <TableCell>{renderBadges(methods, 3)}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {processor.product_manager || "—"}
      </TableCell>
    </TableRow>
  );
}

type PaymentProcessorsTableProps = {
  processors: PaymentProcessor[];
  filteredCount: number;
  totalPages: number;
  derivedByProcessor: Map<string, DerivedSupport>;
  allCountries: string[];
  allMethods: string[];
  filters: PaymentProcessorsFilters;
};

export function PaymentProcessorsTable({
  processors,
  filteredCount,
  totalPages,
  derivedByProcessor,
  allCountries,
  allMethods,
  filters,
}: PaymentProcessorsTableProps) {
  const { page, search, updateSearch, goToPage } = filters;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-[280px] sm:max-w-md">
          <Input
            placeholder="Search PSP, country, or payment method..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <FiltersDropdown
            allCountries={allCountries}
            allMethods={allMethods}
            filters={filters}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Processor</TableHead>
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
              <TableHead className="font-semibold text-center">
                Local Inst.
              </TableHead>
              <TableHead className="font-semibold">Countries</TableHead>
              <TableHead className="font-semibold">Payment methods</TableHead>
              <TableHead className="font-semibold">PM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  No processors found. Try adjusting your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              processors.map((processor) => (
                <ProcessorRow
                  key={processor.id}
                  processor={processor}
                  derived={derivedByProcessor.get(processor.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        displayedCount={processors.length}
        totalCount={filteredCount}
        onPageChange={goToPage}
      />
    </div>
  );
}
