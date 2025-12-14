"use client";

import {
  ChevronDown,
  ChevronRight,
  Circle,
  FileText,
  Filter,
  Hash,
  Mail,
  Search,
  Video,
} from "lucide-react";
import { Fragment, useState } from "react";

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
import type { SourceType } from "@/core/db/schema";

// Source type styling and display config
const sourceStyles: Record<
  SourceType,
  { bg: string; icon: typeof Video; label: string; dot: string }
> = {
  MEETING: {
    bg: "bg-purple-100 text-purple-700",
    icon: Video,
    label: "Meeting",
    dot: "bg-purple-500",
  },
  EMAIL: {
    bg: "bg-blue-100 text-blue-700",
    icon: Mail,
    label: "Email",
    dot: "bg-blue-500",
  },
  SLACK: {
    bg: "bg-green-100 text-green-700",
    icon: Hash,
    label: "Slack",
    dot: "bg-green-500",
  },
  SALESFORCE: {
    bg: "bg-cyan-100 text-cyan-700",
    icon: FileText,
    label: "Salesforce",
    dot: "bg-cyan-500",
  },
  DOCUMENT: {
    bg: "bg-amber-100 text-amber-700",
    icon: FileText,
    label: "Document",
    dot: "bg-amber-500",
  },
  MANUAL: {
    bg: "bg-slate-100 text-slate-700",
    icon: FileText,
    label: "Manual",
    dot: "bg-slate-500",
  },
};

// Type for event data from API
type InboundEvent = {
  id: string;
  merchant_id: string;
  source_type: SourceType;
  source_id: string | null;
  raw_content: string;
  metadata: Record<string, unknown> | null;
  processing_status: string;
  processed_at: Date | null;
  created_at: Date;
};

type EventsTableProps = {
  events: InboundEvent[];
  search: string;
  setSearch: (value: string) => void;
  sourceFilter: SourceType | "ALL";
  setSourceFilter: (value: SourceType | "ALL") => void;
};

/**
 * Get the title/subject from an event based on its source type
 */
function getEventTitle(event: InboundEvent): string {
  const metadata = event.metadata;
  if (!metadata) return "Untitled";

  switch (event.source_type) {
    case "MEETING":
      return (metadata.title as string) || "Untitled Meeting";
    case "EMAIL":
      return (metadata.subject as string) || "No Subject";
    case "SLACK":
      return `#${(metadata.channel as string) || "channel"}`;
    default:
      return "Event";
  }
}

/**
 * Get a preview of the content (first ~100 chars)
 */
function getContentPreview(content: string, maxLength = 120): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}...`;
}

/**
 * Format the event date
 */
function formatEventDate(date: Date): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get metadata details for display
 */
function getMetadataDetails(event: InboundEvent): string | null {
  const metadata = event.metadata;
  if (!metadata) return null;

  switch (event.source_type) {
    case "MEETING": {
      const duration = metadata.duration as number | undefined;
      const participants = metadata.parties as
        | Array<{ name?: string }>
        | undefined;
      const parts: string[] = [];
      if (duration) {
        const mins = Math.round(duration / 60);
        parts.push(`${mins} min`);
      }
      if (participants?.length) {
        parts.push(`${participants.length} participants`);
      }
      return parts.length > 0 ? parts.join(" / ") : null;
    }
    case "EMAIL": {
      const from = metadata.from as string | undefined;
      return from ? `From: ${from}` : null;
    }
    default:
      return null;
  }
}

export function EventsTable({
  events,
  search,
  setSearch,
  sourceFilter,
  setSourceFilter,
}: EventsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              className="pl-9 h-9 w-[250px] bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Source Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-slate-500 hover:text-slate-900"
              >
                <Filter className="mr-2 h-4 w-4" />
                {sourceFilter === "ALL"
                  ? "All Sources"
                  : sourceStyles[sourceFilter].label}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px]">
              <DropdownMenuLabel className="text-xs text-slate-500">
                Filter by source
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSourceFilter("ALL")}>
                <Circle className="mr-2 h-2 w-2" />
                All Sources
              </DropdownMenuItem>
              {(
                [
                  "MEETING",
                  "EMAIL",
                  "SLACK",
                  "DOCUMENT",
                  "MANUAL",
                ] as SourceType[]
              ).map((source) => {
                const style = sourceStyles[source];
                const Icon = style.icon;
                return (
                  <DropdownMenuItem
                    key={source}
                    onClick={() => setSourceFilter(source)}
                  >
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {style.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{events.length} events</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
              <TableHead className="w-[40px]" />
              <TableHead className="w-[100px] font-medium text-slate-500">
                Source
              </TableHead>
              <TableHead className="w-[200px] font-medium text-slate-500">
                Title
              </TableHead>
              <TableHead className="font-medium text-slate-500">
                Content Preview
              </TableHead>
              <TableHead className="w-[140px] font-medium text-slate-500">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-slate-500"
                >
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const style = sourceStyles[event.source_type];
                const Icon = style.icon;
                const isExpanded = expandedRow === event.id;
                const metadataDetails = getMetadataDetails(event);

                return (
                  <Fragment key={event.id}>
                    <TableRow
                      className="group hover:bg-slate-50/50 transition-colors border-b-slate-100 cursor-pointer"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <TableCell className="pl-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${style.bg} font-medium`}
                        >
                          <Icon className="mr-1 h-3 w-3" />
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 truncate max-w-[180px]">
                            {getEventTitle(event)}
                          </span>
                          {metadataDetails && (
                            <span className="text-xs text-slate-400">
                              {metadataDetails}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <span className="text-sm line-clamp-2">
                          {getContentPreview(event.raw_content)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatEventDate(event.created_at)}
                      </TableCell>
                    </TableRow>

                    {/* Expanded content row */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50/30">
                        <TableCell colSpan={5} className="p-0">
                          <div className="px-6 py-4 border-t border-slate-100">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-slate-900">
                                  Full Content
                                </h4>
                                {/* TODO: Add link to view AI extractions from this event */}
                              </div>
                              <div className="bg-white rounded-lg border border-slate-200 p-4 max-h-[400px] overflow-y-auto">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                                  {event.raw_content}
                                </pre>
                              </div>
                              {event.metadata && (
                                <div className="text-xs text-slate-500">
                                  <span className="font-medium">
                                    Source ID:
                                  </span>{" "}
                                  {event.source_id || "N/A"}
                                  {" / "}
                                  <span className="font-medium">Status:</span>{" "}
                                  {event.processing_status}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
