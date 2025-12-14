"use client";

import { usePaymentProcessorsFilters } from "../hooks/use-payment-processors-filters";
import { usePaymentProcessorsData } from "../hooks/use-payment-processors-data";
import { PaymentProcessorsTable } from "./payment-processors-table";
import { PaymentProcessorsLoader } from "./payment-processors-loader";

export function PaymentProcessorsContainer() {
  const filters = usePaymentProcessorsFilters();

  const {
    isLoading,
    allCountries,
    allMethods,
    processors,
    filteredProcessors,
    totalPages,
    derivedByProcessor,
  } = usePaymentProcessorsData({
    page: filters.page,
    search: filters.search,
    selectedCountries: filters.selectedCountries,
    selectedMethods: filters.selectedMethods,
    capabilities: filters.capabilities,
  });

  if (isLoading) {
    return <PaymentProcessorsLoader />;
  }

  return (
    <PaymentProcessorsTable
      processors={processors}
      filteredCount={filteredProcessors.length}
      totalPages={totalPages}
      derivedByProcessor={derivedByProcessor}
      allCountries={allCountries}
      allMethods={allMethods}
      filters={filters}
    />
  );
}
