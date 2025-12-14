"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export default function Home() {
  const trpc = useTRPC();
  const {
    data: merchants,
    isLoading,
    error,
  } = useQuery(trpc.merchants.list.queryOptions());

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <h1 className="mb-6 text-2xl font-bold">Merchants</h1>

      {isLoading && <p>Loading merchants...</p>}

      {error && <p className="text-red-500">Error: {error.message}</p>}

      {merchants && merchants.length === 0 && <p>No merchants found.</p>}

      {merchants && merchants.length > 0 && (
        <ul className="w-full max-w-md space-y-2">
          {merchants.map((merchant) => (
            <li
              key={merchant.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium">{merchant.name}</p>
              <p className="text-sm text-zinc-500">Status: {merchant.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
