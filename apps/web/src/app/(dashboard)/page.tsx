import {
  getPaymentProcessors,
  getCountryProcessorFeatures,
} from "@/core/actions/payments";
import { DashboardTabs } from "@/components/payments";

export default async function Home() {
  const [processorsResult, featuresResult] = await Promise.all([
    getPaymentProcessors({ page: 1, pageSize: 10 }),
    getCountryProcessorFeatures({ page: 1, pageSize: 10 }),
  ]);

  if (!processorsResult.success || !processorsResult.data || !processorsResult.pagination ||
    !featuresResult.success || !featuresResult.data || !featuresResult.pagination) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">
              {processorsResult.error || featuresResult.error || "Failed to load data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex ">
      <div className="min-h-screen bg-white p-6 w-full flex items-center justify-center">
        <div className="max-w-7xl w-full space-y-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">
              Payment Processors
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage payment processors and their country-specific features
            </p>
          </header>

          <DashboardTabs
            processorsData={processorsResult.data}
            processorsPagination={processorsResult.pagination}
            featuresData={featuresResult.data}
            featuresPagination={featuresResult.pagination}
          />
        </div>
      </div>
    </div>
  );
}