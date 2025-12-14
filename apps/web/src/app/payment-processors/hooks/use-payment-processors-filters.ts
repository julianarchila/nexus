"use client";

import { useState, useCallback } from "react";

export type CapabilityFilters = {
  payouts: boolean;
  recurring: boolean;
  refunds: boolean;
  crypto: boolean;
  local_instruments: boolean;
};

const initialCapabilities: CapabilityFilters = {
  payouts: false,
  recurring: false,
  refunds: false,
  crypto: false,
  local_instruments: false,
};

export function usePaymentProcessorsFilters() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [capabilities, setCapabilities] =
    useState<CapabilityFilters>(initialCapabilities);

  const activeFiltersCount =
    selectedCountries.length +
    selectedMethods.length +
    Object.values(capabilities).filter(Boolean).length;

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const toggleCountry = useCallback((country: string, checked: boolean) => {
    setSelectedCountries((prev) => {
      const next = checked
        ? [...new Set([...prev, country])].sort()
        : prev.filter((c) => c !== country);
      return next;
    });
    setPage(1);
  }, []);

  const toggleMethod = useCallback((method: string, checked: boolean) => {
    setSelectedMethods((prev) => {
      const next = checked
        ? [...new Set([...prev, method])].sort()
        : prev.filter((m) => m !== method);
      return next;
    });
    setPage(1);
  }, []);

  const toggleCapability = useCallback(
    (key: keyof CapabilityFilters, checked: boolean) => {
      setCapabilities((prev) => ({ ...prev, [key]: checked }));
      setPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSelectedCountries([]);
    setSelectedMethods([]);
    setCapabilities(initialCapabilities);
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    // State
    page,
    search,
    selectedCountries,
    selectedMethods,
    capabilities,
    activeFiltersCount,

    // Actions
    updateSearch,
    toggleCountry,
    toggleMethod,
    toggleCapability,
    clearFilters,
    goToPage,
  };
}

export type PaymentProcessorsFilters = ReturnType<
  typeof usePaymentProcessorsFilters
>;
