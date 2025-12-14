import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/core/db/client";
import {
  countryProcessorFeatures,
  merchant_profile,
  paymentProcessors,
  scope_in_doc_info,
} from "@/core/db/schema";
import { publicProcedure, router } from "./init";
import { z } from "zod";

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
      const merchants = await db.select().from(merchant_profile);
      return merchants;
    }),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      const merchant = await db
        .select()
        .from(merchant_profile)
        .where(eq(merchant_profile.id, input))
        .limit(1);

      if (merchant.length === 0) return null;

      const scope = await db
        .select()
        .from(scope_in_doc_info)
        .where(eq(scope_in_doc_info.merchant_profile_id, input))
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
        .from(merchant_profile)
        .where(eq(merchant_profile.contact_email, TEST_MERCHANT_EMAIL))
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
        .from(scope_in_doc_info)
        .where(eq(scope_in_doc_info.merchant_profile_id, merchantRecord.id))
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
      .query(async (opts) => {
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
