"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  FileText,
  History,
  Mail,
  MoreVertical,
  User,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import {
  ImplementationTracker,
  ReadinessIndicator,
  StageTransitionModal,
} from "@/components/pipeline";
import { ScopeEditor } from "@/components/scope/scope-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LifecycleStage } from "@/core/db/schema";

import { useMerchantAuditLog } from "./hooks/use-merchant-audit-log";
import { useMerchantDetail } from "./hooks/use-merchant-detail";

// Lifecycle stage styles
const stageStyles: Record<
  LifecycleStage,
  { bg: string; icon: typeof Activity }
> = {
  SCOPING: {
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    icon: FileText,
  },
  IMPLEMENTING: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Activity,
  },
  LIVE: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

const stageLabels: Record<LifecycleStage, string> = {
  SCOPING: "Scoping",
  IMPLEMENTING: "Implementing",
  LIVE: "Live",
};

export default function MerchantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    merchant,
    scope,
    attachments,
    scopeReadiness,
    implementationReadiness,
    isLoading,
    isError,
    error,
  } = useMerchantDetail(id);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  if (isLoading) {
    return <MerchantPageSkeleton />;
  }

  if (isError || !merchant) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-medium text-slate-900">
          Failed to load merchant
        </h3>
        <p className="text-slate-500">
          {error?.message || "Merchant not found"}
        </p>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const StageIcon = stageStyles[merchant.lifecycle_stage].icon;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Merchants
          </Link>
          <span>/</span>
          <span>{merchant.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-2xl font-bold text-blue-600 border border-blue-100 shadow-sm">
              {merchant.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {merchant.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {merchant.contact_email}
                </span>
                {merchant.contact_name && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {merchant.contact_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stage transition button - only show for SCOPING and IMPLEMENTING */}
            {merchant.lifecycle_stage !== "LIVE" && (
              <Button
                variant="outline"
                onClick={() => setShowTransitionModal(true)}
                className="flex items-center gap-2"
              >
                Move to{" "}
                {merchant.lifecycle_stage === "SCOPING"
                  ? "Implementing"
                  : "Live"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            <div
              className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${stageStyles[merchant.lifecycle_stage].bg}`}
            >
              <StageIcon className="h-4 w-4" />
              {stageLabels[merchant.lifecycle_stage]}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 mb-8 gap-6">
          {["Overview", "Scoping & Specs", "Documents", "Activity"].map(
            (tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase().split(" ")[0]}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-1 py-3 font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {tab}
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {/* Overview Content */}
        <TabsContent
          value="overview"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Company Details */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-500" />
                    Merchant Profile
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Merchant Name
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {merchant.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Contact Email
                    </label>
                    <p className="text-sm font-medium text-slate-900 font-mono">
                      {merchant.contact_email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Contact Name
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {merchant.contact_name || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Lifecycle Stage
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {stageLabels[merchant.lifecycle_stage]}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Sales Owner
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {merchant.sales_owner || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Implementation Owner
                    </label>
                    <p className="text-sm font-medium text-slate-900">
                      {merchant.implementation_owner || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementation Tracker - only show in IMPLEMENTING stage */}
              {merchant.lifecycle_stage === "IMPLEMENTING" && (
                <ImplementationTracker merchantId={id} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Readiness Indicator - shows appropriate readiness based on stage */}
              <ReadinessIndicator
                lifecycleStage={merchant.lifecycle_stage}
                scopeReadiness={scopeReadiness}
                implementationReadiness={implementationReadiness}
              />

              {/* Activity Log */}
              <ActivityLogPanel merchantId={id} />
            </div>
          </div>
        </TabsContent>

        {/* Scoping Content */}
        <TabsContent
          value="scoping"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {scope ? (
            <ScopeEditor scope={scope} merchantId={id} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-slate-500">No scope data available</p>
            </div>
          )}
        </TabsContent>

        {/* Documents Content */}
        <TabsContent
          value="documents"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attachments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 group-hover:text-slate-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <h4 className="font-medium text-slate-900 truncate mb-1">
                    {doc.filename}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                      {doc.category || doc.file_type}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents uploaded yet</p>
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent
          value="activity"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <ActivityLogPanel merchantId={id} expanded />
        </TabsContent>
      </Tabs>

      {/* Stage Transition Modal */}
      <StageTransitionModal
        merchantId={id}
        merchantName={merchant.name}
        currentStage={merchant.lifecycle_stage}
        isOpen={showTransitionModal}
        onClose={() => setShowTransitionModal(false)}
      />
    </div>
  );
}

// ===========================================
// HELPER COMPONENTS
// ===========================================

function MerchantPageSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityLogPanel({
  merchantId,
  expanded = false,
}: {
  merchantId: string;
  expanded?: boolean;
}) {
  const { logs, isLoading, pagination, page, setPage } =
    useMerchantAuditLog(merchantId);

  const actorStyles = {
    AI: { dot: "bg-purple-500", text: "text-purple-600" },
    USER: { dot: "bg-blue-500", text: "text-blue-600" },
    SYSTEM: { dot: "bg-slate-300", text: "text-slate-500" },
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const height = expanded ? "h-[600px]" : "h-[500px]";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col ${height}`}
    >
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          Activity Log
        </h3>
        {pagination && (
          <span className="text-xs text-slate-500">
            {pagination.total} events
          </span>
        )}
      </div>
      <ScrollArea className="flex-1 p-6">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No activity yet
          </p>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => {
              const style = actorStyles[log.actor_type] || actorStyles.SYSTEM;
              return (
                <div
                  key={log.id}
                  className="relative pl-6 border-l border-slate-100"
                >
                  <div
                    className={`absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${style.dot} shadow-sm`}
                  />
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700 leading-snug">
                      <span className="font-medium">{log.change_type}</span>
                      {log.target_field && (
                        <span className="text-slate-500">
                          {" "}
                          on {log.target_field}
                        </span>
                      )}
                      {log.reason && (
                        <span className="text-slate-500">: {log.reason}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`font-medium ${style.text}`}>
                        {log.actor_type}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(log.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
