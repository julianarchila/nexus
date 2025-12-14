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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SlidersHorizontal } from "lucide-react";
import type {
  PaymentProcessor,
  DerivedSupport,
} from "../hooks/use-payment-processors-data";
import type {
  PaymentProcessorsFilters,
  CapabilityFilters,
} from "../hooks/use-payment-processors-filters";

// ----- Presentation Helpers -----

function BadgesWithPopover({ items, max = 3 }: { items: string[]; max?: number }) {
  if (items.length === 0) {
    return <span className="text-[#8898aa]">—</span>;
  }

  const shown = items.slice(0, max);
  const remaining = items.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs font-normal">
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs font-normal cursor-pointer hover:bg-slate-100 transition-colors"
            >
              +{remaining}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 mb-2">
                All items ({items.length})
              </p>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {items.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs font-normal mr-1 mb-1"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
  return (
    <Badge variant={config.variant} className="font-normal">
      {config.label}
    </Badge>
  );
}

function CapabilityCell({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={
        enabled ? "text-[#00d924] text-base font-semibold" : "text-[#8898aa]"
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
        <Button variant="outline" className="h-9 text-[14px]">
          <SlidersHorizontal className="w-4 h-4" />
          Add filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 font-normal">
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
      <p className="text-[14px] text-[#425466]">
        Showing{" "}
        <span className="font-medium text-[#0a2540]">{displayedCount}</span> of{" "}
        <span className="font-medium text-[#0a2540]">{totalCount}</span>{" "}
        processors
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-8 text-[14px]"
        >
          Previous
        </Button>
        <span className="text-[14px] px-2 text-[#425466]">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 text-[14px]"
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
    <TableRow className="hover:bg-[#f6f9fc] border-b border-[#e6ebf1]">
      <TableCell className="py-4">
        <div className="font-medium text-[#0a2540] text-[14px]">
          {processor.name}
        </div>
        <div className="text-[#8898aa] font-mono text-[13px] mt-0.5">
          {processor.id}
        </div>
      </TableCell>
      <TableCell className="py-4">{getStatusBadge(processor.status)}</TableCell>
      <TableCell className="text-center py-4">
        <CapabilityCell enabled={!!derived?.supports_payouts} />
      </TableCell>
      <TableCell className="text-center py-4">
        <CapabilityCell enabled={processor.supports_recurring} />
      </TableCell>
      <TableCell className="text-center py-4">
        <CapabilityCell enabled={processor.supports_refunds} />
      </TableCell>
      <TableCell className="text-center py-4">
        <CapabilityCell enabled={!!derived?.supports_crypto} />
      </TableCell>
      <TableCell className="text-center py-4">
        <CapabilityCell enabled={!!derived?.supports_local_instruments} />
      </TableCell>
      <TableCell className="py-4">
        <BadgesWithPopover items={countries} max={3} />
      </TableCell>
      <TableCell className="py-4">
        <BadgesWithPopover items={methods} max={3} />
      </TableCell>
      <TableCell className="text-[#8898aa] text-[14px] py-4">
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
            placeholder="Search"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-9 text-[14px] bg-white border-[#e6ebf1] placeholder:text-[#8898aa]"
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
      <div className="rounded-lg bg-white overflow-hidden border border-[#e6ebf1] shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#e6ebf1] bg-white">
              <TableHead className="font-medium text-[#425466] text-[13px] py-3">
                Processor
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] py-3">
                Status
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] text-center py-3">
                Payouts
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] text-center py-3">
                Recurring
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] text-center py-3">
                Refunds
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] text-center py-3">
                Crypto
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] text-center py-3">
                Local Inst.
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] py-3">
                Countries
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] py-3">
                Payment methods
              </TableHead>
              <TableHead className="font-medium text-[#425466] text-[13px] py-3">
                PM
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-[#8898aa]"
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
