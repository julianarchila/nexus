"use client";

import * as React from "react";
import Link from "next/link";
import { 
  MoreHorizontal, 
  FileText, 
  ChevronDown, 
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { MOCK_MERCHANTS, Merchant, MerchantStatus } from "@/core/mocks/merchants";

const statusColors: Record<MerchantStatus, string> = {
  Prospect: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  Onboarding: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  Live: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  Churned: "bg-rose-100 text-rose-700 hover:bg-rose-200",
};

export function MerchantsTable() {
  const [merchants, setMerchants] = React.useState<Merchant[]>(MOCK_MERCHANTS);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleStatusChange = (id: string, newStatus: MerchantStatus) => {
    setMerchants(merchants.map(m => 
      m.id === id ? { ...m, status: newStatus } : m
    ));
  };

  const filteredMerchants = merchants.filter(merchant => 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="h-9 text-slate-500 hover:text-slate-900">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-slate-500 hover:text-slate-900">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{filteredMerchants.length} merchants</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
              <TableHead className="w-[300px] font-medium text-slate-500 pl-4">Name</TableHead>
              <TableHead className="w-[150px] font-medium text-slate-500">Status</TableHead>
              <TableHead className="font-medium text-slate-500 text-right">Addressable TPV</TableHead>
              <TableHead className="font-medium text-slate-500 text-center">Approval Rate</TableHead>
              <TableHead className="font-medium text-slate-500">Merchant ID</TableHead>
              <TableHead className="font-medium text-slate-500">Account Owner</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMerchants.map((merchant) => (
              <TableRow key={merchant.id} className="group hover:bg-slate-50/50 transition-colors border-b-slate-100">
                <TableCell className="font-medium pl-4">
                  <Link 
                    href={`/merchants/${merchant.id}`}
                    className="flex items-center gap-3 py-1 group-hover:text-blue-600 transition-colors"
                  >
                    <span className="text-xl leading-none">{merchant.logo}</span>
                    <span className="font-semibold">{merchant.name}</span>
                    <FileText className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer outline-none ring-offset-1 focus:ring-2 ring-blue-500/20 ${statusColors[merchant.status]}`}
                      >
                        {merchant.status}
                        <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[140px]">
                      <DropdownMenuLabel className="text-xs text-slate-500">Set status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(statusColors) as MerchantStatus[]).map((status) => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={() => handleStatusChange(merchant.id, status)}
                          className="gap-2 text-xs font-medium"
                        >
                          <div className={`h-2 w-2 rounded-full ${
                            status === "Live" ? "bg-emerald-500" :
                            status === "Onboarding" ? "bg-amber-500" :
                            status === "Prospect" ? "bg-slate-400" :
                            "bg-rose-500"
                          }`} />
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-right font-mono text-slate-600">
                  ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(merchant.tpv)}
                </TableCell>
                <TableCell className="text-center">
                  {merchant.approvalRate > 0 ? (
                    <Badge variant="outline" className={`font-mono font-normal border-0 ${
                      merchant.approvalRate >= 90 ? "bg-emerald-50 text-emerald-700" :
                      merchant.approvalRate >= 80 ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    }`}>
                      {merchant.approvalRate}%
                    </Badge>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">
                  {merchant.id}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {merchant.accountOwner.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm text-slate-600 truncate max-w-[120px]">
                      {merchant.accountOwner}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
