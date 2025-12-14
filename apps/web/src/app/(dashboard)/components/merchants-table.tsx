"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LifecycleStage } from "@/core/db/schema";

// Lifecycle stage colors (SCOPING, IMPLEMENTING, LIVE)
const stageStyles: Record<LifecycleStage, { bg: string; dot: string }> = {
  SCOPING: {
    bg: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    dot: "bg-slate-400",
  },
  IMPLEMENTING: {
    bg: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    dot: "bg-amber-500",
  },
  LIVE: {
    bg: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    dot: "bg-emerald-500",
  },
};

// Display labels for stages
const stageLabels: Record<LifecycleStage, string> = {
  SCOPING: "Scoping",
  IMPLEMENTING: "Implementing",
  LIVE: "Live",
};

// Types for the merchant data
type Merchant = {
  id: string;
  name: string;
  lifecycle_stage: LifecycleStage;
  scope_is_complete: boolean | null;
  contact_email: string;
  contact_name: string | null;
  sales_owner: string | null;
  implementation_owner: string | null;
};

type MerchantsTableProps = {
  merchants: Merchant[];
  search: string;
  setSearch: (value: string) => void;
  stageFilter: LifecycleStage | "ALL";
  setStageFilter: (value: LifecycleStage | "ALL") => void;
};

export function MerchantsTable({
  merchants,
  search,
  setSearch,
  stageFilter,
  setStageFilter,
}: MerchantsTableProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search merchants..."
              className="pl-9 h-9 w-[250px] bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Stage Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-slate-500 hover:text-slate-900"
              >
                <Filter className="mr-2 h-4 w-4" />
                {stageFilter === "ALL"
                  ? "All Stages"
                  : stageLabels[stageFilter]}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px]">
              <DropdownMenuLabel className="text-xs text-slate-500">
                Filter by stage
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStageFilter("ALL")}>
                <Circle className="mr-2 h-2 w-2" />
                All Stages
              </DropdownMenuItem>
              {(["SCOPING", "IMPLEMENTING", "LIVE"] as LifecycleStage[]).map(
                (stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={() => setStageFilter(stage)}
                  >
                    <div
                      className={`mr-2 h-2 w-2 rounded-full ${stageStyles[stage].dot}`}
                    />
                    {stageLabels[stage]}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-slate-500 hover:text-slate-900"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{merchants.length} merchants</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
              <TableHead className="w-[280px] font-medium text-slate-500 pl-4">
                Name
              </TableHead>
              <TableHead className="w-[140px] font-medium text-slate-500">
                Stage
              </TableHead>
              <TableHead className="w-[100px] font-medium text-slate-500 text-center">
                Readiness
              </TableHead>
              <TableHead className="font-medium text-slate-500">
                Contact
              </TableHead>
              <TableHead className="font-medium text-slate-500">
                Sales Owner
              </TableHead>
              <TableHead className="font-medium text-slate-500">
                Impl. Owner
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-slate-500"
                >
                  No merchants found
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((merchant) => (
                <TableRow
                  key={merchant.id}
                  className="group hover:bg-slate-50/50 transition-colors border-b-slate-100"
                >
                  <TableCell className="font-medium pl-4">
                    <Link
                      href={`/merchants/${merchant.id}`}
                      className="flex items-center gap-3 py-1 group-hover:text-blue-600 transition-colors"
                    >
                      <span className="font-semibold">{merchant.name}</span>
                      <FileText className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${stageStyles[merchant.lifecycle_stage].bg}`}
                    >
                      {stageLabels[merchant.lifecycle_stage]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {merchant.scope_is_complete ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-sm truncate max-w-[180px]">
                        {merchant.contact_email}
                      </span>
                      {merchant.contact_name && (
                        <span className="text-xs text-slate-400">
                          {merchant.contact_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {merchant.sales_owner ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {merchant.sales_owner
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm text-slate-600 truncate max-w-[100px]">
                          {merchant.sales_owner}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {merchant.implementation_owner ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                          {merchant.implementation_owner
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm text-slate-600 truncate max-w-[100px]">
                          {merchant.implementation_owner}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
