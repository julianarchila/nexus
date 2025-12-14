import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { db } from "@/core/db/client";
import { attachment, type AttachmentCategory } from "@/core/db/schema";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),

  // Merchant document uploader - supports PDFs, images, and common document formats
  merchantDocumentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
  })
    .input(
      z.object({
        merchantId: z.string(),
        category: z.enum(["CONTRACT", "TECHNICAL_DOC", "OTHER"]).optional(),
        description: z.string().optional(),
      }),
    )
    .middleware(async ({ req, input }) => {
      const user = await auth(req);

      if (!user) throw new UploadThingError("Unauthorized");

      return {
        userId: user.id,
        merchantId: input.merchantId,
        category: input.category,
        description: input.description,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create attachment record in database
      const attachmentId = crypto.randomUUID();

      await db.insert(attachment).values({
        id: attachmentId,
        merchant_id: metadata.merchantId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_url: file.ufsUrl,
        category: metadata.category as AttachmentCategory | undefined,
        description: metadata.description,
        uploaded_by: metadata.userId,
      });

      console.log(
        "Document uploaded for merchant:",
        metadata.merchantId,
        "by user:",
        metadata.userId,
      );

      return {
        attachmentId,
        uploadedBy: metadata.userId,
        merchantId: metadata.merchantId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
