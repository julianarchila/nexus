"use client";

import { use } from "react";

import { MerchantDetailContainer } from "./components/merchant-detail-container";

export default function MerchantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <MerchantDetailContainer merchantId={id} />;
}
