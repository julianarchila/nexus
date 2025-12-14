"use client";

import { useMerchantEvents } from "../hooks/use-merchant-events";
import { EventsLoader } from "./events-loader";
import { EventsTable } from "./events-table";

type EventsPanelProps = {
  merchantId: string;
};

export function EventsPanel({ merchantId }: EventsPanelProps) {
  const {
    events,
    isLoading,
    isError,
    error,
    search,
    setSearch,
    sourceFilter,
    setSourceFilter,
  } = useMerchantEvents(merchantId);

  if (isLoading) {
    return <EventsLoader />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-red-500 font-medium">Failed to load events</p>
        <p className="text-sm text-slate-500 mt-1">{error?.message}</p>
      </div>
    );
  }

  return (
    <EventsTable
      events={events}
      search={search}
      setSearch={setSearch}
      sourceFilter={sourceFilter}
      setSourceFilter={setSourceFilter}
    />
  );
}
