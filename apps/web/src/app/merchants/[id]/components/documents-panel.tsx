"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadDropzone } from "@/lib/uploadthing";
import type { AttachmentCategory } from "@/core/db/schema";

import { useMerchantAttachments } from "../hooks";

type Attachment = {
  id: string;
  merchant_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_url: string;
  category: AttachmentCategory | null;
  description: string | null;
  uploaded_by: string;
  created_at: Date;
};

type DocumentsPanelProps = {
  merchantId: string;
  attachments: Attachment[];
};

export function DocumentsPanel({
  merchantId,
  attachments,
}: DocumentsPanelProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<AttachmentCategory>("OTHER");
  const [isUploading, setIsUploading] = useState(false);
  const { deleteAttachment, isDeleting, invalidateAttachments } =
    useMerchantAttachments(merchantId);

  const handleDelete = (attachmentId: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteAttachment({ attachmentId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-500" />
            Upload Documents
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Category Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as AttachmentCategory)
              }
              className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CONTRACT">Contract</option>
              <option value="TECHNICAL_DOC">Technical Documentation</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Upload Dropzone */}
          <UploadDropzone
            endpoint="merchantDocumentUploader"
            input={{
              merchantId,
              category: selectedCategory,
            }}
            onUploadBegin={() => setIsUploading(true)}
            onClientUploadComplete={() => {
              setIsUploading(false);
              invalidateAttachments();
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              alert(`Upload failed: ${error.message}`);
            }}
            className="ut-label:text-slate-700 ut-allowed-content:text-slate-500 ut-button:bg-blue-600 ut-button:hover:bg-blue-700 border-dashed border-2 border-gray-200 rounded-lg"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            Uploaded Documents
          </h3>
          <span className="text-sm text-slate-500">
            {attachments.length} document{attachments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {attachments.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {attachments.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <FileIcon fileType={doc.file_type} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">
                      {doc.filename}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                        {getCategoryLabel(doc.category)}
                      </span>
                      <span>-</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>-</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      disabled={isDeleting}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a
                        href={doc.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={doc.storage_url}
                        download={doc.filename}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 focus:text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No documents uploaded yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Upload contracts, technical docs, or other files above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  // Return appropriate icon based on file type
  return <FileText className="h-5 w-5" />;
}

function getCategoryLabel(category: AttachmentCategory | null): string {
  switch (category) {
    case "CONTRACT":
      return "Contract";
    case "TECHNICAL_DOC":
      return "Technical Doc";
    case "OTHER":
    default:
      return "Other";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
