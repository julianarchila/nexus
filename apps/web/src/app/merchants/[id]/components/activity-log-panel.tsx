"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { useMerchantAuditLog } from "../hooks/use-merchant-audit-log";

type ActivityLogPanelProps = {
  merchantId: string;
  expanded?: boolean;
};

export function ActivityLogPanel({
  merchantId,
  expanded = false,
}: ActivityLogPanelProps) {
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
            <div key={`skeleton-${i}`} className="flex gap-3">
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
