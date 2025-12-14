import { MerchantsTable } from "@/components/merchants-table";

export default function Home() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>Workspace</span>
            <span>/</span>
            <span>Commercial</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Merchants (Accounts)
            <span className="text-lg font-normal text-slate-400 mt-2">
              All View
            </span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <MerchantsTable />
    </div>
  );
}
