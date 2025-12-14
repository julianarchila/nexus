"use client";

import { useState, useEffect, useCallback } from "react";
import { MerchantData, ActivityLog } from "@/core/types/merchant";
import { mockMerchantService } from "@/core/services/mock-merchant-service";

interface UseMerchantProfileReturn {
  data: MerchantData | null;
  isLoading: boolean;
  error: Error | null;
  addLog: (message: string, type?: ActivityLog["type"]) => void;
  updateStatus: (newStatus: MerchantData["profile"]["status"]) => void;
}

export const useMerchantProfile = (id: string): UseMerchantProfileReturn => {
  const [data, setData] = useState<MerchantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    mockMerchantService
      .getMerchant(id)
      .then((merchant) => {
        if (isMounted) {
          setData(merchant);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch merchant data"));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Real-time Simulation Effect
  useEffect(() => {
    if (!data) return;

    const intervalId = setInterval(() => {
      const aiMessages = [
        "🤖 AI Copilot updated TPV forecast based on recent trends.",
        "🤖 AI Copilot detected a new optimization opportunity.",
        "🤖 AI Copilot validated integration documents.",
        "🤖 AI Copilot flagged a potential churn risk factor.",
      ];
      
      const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
      
      const newLog: ActivityLog = {
        id: `LOG-RT-${Date.now()}`,
        type: "AI",
        message: randomMessage,
        timestamp: new Date().toISOString(),
      };

      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          activityLog: [newLog, ...prev.activityLog],
        };
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [data]);

  // Actions for Optimistic Updates
  const addLog = useCallback((message: string, type: ActivityLog["type"] = "User") => {
    const newLog: ActivityLog = {
      id: `LOG-OPT-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        activityLog: [newLog, ...prev.activityLog],
      };
    });
  }, []);

  const updateStatus = useCallback((newStatus: MerchantData["profile"]["status"]) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          status: newStatus,
        },
      };
    });
  }, []);

  return {
    data,
    isLoading,
    error,
    addLog,
    updateStatus,
  };
};
