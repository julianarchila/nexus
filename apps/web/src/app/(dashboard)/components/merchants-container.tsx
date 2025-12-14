"use client";

import { useMerchantsList } from "../hooks/use-merchants-list";
import { MerchantsLoader } from "./merchants-loader";
import { MerchantsTable } from "./merchants-table";

export function MerchantsContainer() {
  const {
    merchants,
    isLoading,
    isError,
    error,
    search,
    setSearch,
    stageFilter,
    setStageFilter,
  } = useMerchantsList();

  if (isLoading) {
    return <MerchantsLoader />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-red-500 font-medium">Failed to load merchants</p>
        <p className="text-sm text-slate-500 mt-1">{error?.message}</p>
      </div>
    );
  }

  return (
    <MerchantsTable
      merchants={merchants}
      search={search}
      setSearch={setSearch}
      stageFilter={stageFilter}
      setStageFilter={setStageFilter}
    />
  );
}
