"use client";

import { PaymentProcessorsContainer } from "./components/payment-processors-container";

export default function PaymentProcessorsPage() {
  return (
    <div className="w-full bg-[#f6f9fc] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#0a2540] mb-2">
            Payment Processors
          </h1>
          <p className="text-[15px] text-[#425466]">
            Search and filter to check supported PSPs, countries, and payment
            methods.
          </p>
        </header>

        <PaymentProcessorsContainer />
      </div>
    </div>
  );
}
