"use client";

import { PaymentProcessorsContainer } from "./components/payment-processors-container";

export default function PaymentProcessorsPage() {
  return (
    <div className="w-full flex mt-4">
      <div className="min-h-screen bg-white p-6 w-full flex items-center justify-center">
        <div className="max-w-7xl w-full space-y-6">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">
              Payment Processors
            </h1>
            <p className="text-muted-foreground mt-2">
              Search and filter to check supported PSPs, countries, and payment
              methods.
            </p>
          </header>

          <PaymentProcessorsContainer />
        </div>
      </div>
    </div>
  );
}
