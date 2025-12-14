"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ScopePDFData } from "./types";

interface UseScopePDFOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useScopePDF(options: UseScopePDFOptions = {}) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async (
        data: ScopePDFData,
        filename?: string,
    ): Promise<void> => {
        setIsGenerating(true);

        try {
            // Dynamic imports for better code splitting and SSR compatibility
            const [{ pdf }, { ScopeDocument }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("./scope-document"),
            ]);

            // Generate the PDF blob
            const pdfDocument = ScopeDocument({ data });
            const blob = await pdf(pdfDocument).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const downloadLink = globalThis.document.createElement("a");
            downloadLink.href = url;
            downloadLink.download =
                filename ||
                `scope-${data.merchantName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;

            // Trigger download
            globalThis.document.body.appendChild(downloadLink);
            downloadLink.click();

            // Cleanup
            globalThis.document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully");
            options.onSuccess?.();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to generate PDF: ${errorMessage}`);
            options.onError?.(
                error instanceof Error ? error : new Error(errorMessage),
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generatePDF,
        isGenerating,
    };
}
