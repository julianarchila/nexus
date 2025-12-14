"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

/**
 * Hook for managing merchant attachments
 * Provides delete mutation and cache invalidation after uploads
 */
export function useMerchantAttachments(merchantId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteAttachmentMutation = useMutation(
    trpc.attachments.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate attachments query to refetch
        queryClient.invalidateQueries({
          queryKey: trpc.attachments.getByMerchantId.queryKey(merchantId),
        });
      },
    }),
  );

  const invalidateAttachments = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.attachments.getByMerchantId.queryKey(merchantId),
    });
  };

  return {
    deleteAttachment: deleteAttachmentMutation.mutate,
    isDeleting: deleteAttachmentMutation.isPending,
    invalidateAttachments,
  };
}
