import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/core/db/client";
import {
  countryProcessorFeatures,
  merchantProfile,
  paymentProcessors,
  scopeInDoc,
} from "@/core/db/schema";
import { publicProcedure, router } from "./init";

// Test merchant email (must match seed.ts and mong.ts)
const TEST_MERCHANT_EMAIL = "maria.garcia@acmecorp.com";

// Input schemas
const getProcessorsInput = z.object({});

const getCountryFeaturesInput = z.object({});

const getProcessorWithFeaturesInput = z.object({
  processorId: z.string(),
});

export const appRouter = router({
  merchants: router({
    list: publicProcedure.query(async () => {
      const merchants = await db.select().from(merchantProfile);
      return merchants;
    }),
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input }: { input: string }) => {
        const merchant = await db
          .select()
          .from(merchantProfile)
          .where(eq(merchantProfile.id, input))
          .limit(1);

        if (merchant.length === 0) return null;

        const scope = await db
          .select()
          .from(scopeInDoc)
          .where(eq(scopeInDoc.merchant_id, input))
          .limit(1);

        return {
          merchant: merchant[0],
          scope: scope[0] ?? null,
        };
      }),
  }),
  debug: router({
    // Get the test subject (Acme Corp) with their scope data
    testSubject: publicProcedure.query(async () => {
      const merchant = await db
        .select()
        .from(merchantProfile)
        .where(eq(merchantProfile.contact_email, TEST_MERCHANT_EMAIL))
        .limit(1);

      if (merchant.length === 0) {
        return {
          found: false,
          merchant: null,
          scope: null,
        };
      }

      const merchantRecord = merchant[0];

      const scope = await db
        .select()
        .from(scopeInDoc)
        .where(eq(scopeInDoc.merchant_id, merchantRecord.id))
        .limit(1);

      return {
        found: true,
        merchant: merchantRecord,
        scope: scope[0] ?? null,
      };
    }),
  }),
  payments: router({
    getProcessors: publicProcedure.input(getProcessorsInput).query(async () => {
      // Fetch all processors at once - data doesn't change frequently
      const processors = await db.select().from(paymentProcessors);

      return processors;
    }),
    getCountryFeatures: publicProcedure
      .input(getCountryFeaturesInput)
      .query(async () => {
        // Fetch all country features at once - data doesn't change frequently
        const features = await db.select().from(countryProcessorFeatures);

        return features;
      }),
    getProcessorWithFeatures: publicProcedure
      .input(getProcessorWithFeaturesInput)
      .query(async (opts: { input: { processorId: string } }) => {
        const processor = await db
          .select()
          .from(paymentProcessors)
          .where(eq(paymentProcessors.id, opts.input.processorId))
          .limit(1);

        if (processor.length === 0) {
          throw new Error("Processor not found");
        }

        const features = await db
          .select()
          .from(countryProcessorFeatures)
          .where(
            eq(countryProcessorFeatures.processor_id, opts.input.processorId),
          );

        return {
          processor: processor[0],
          features,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
