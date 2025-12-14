import { db } from "@/core/db/client";
import { merchant_profile, scope_in_doc_info } from "@/core/db/schema";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "./init";

// Test merchant email (must match seed.ts and mong.ts)
const TEST_MERCHANT_EMAIL = "maria.garcia@acmecorp.com";

export const appRouter = router({
  merchants: router({
    list: publicProcedure.query(async () => {
      const merchants = await db.select().from(merchant_profile);
      return merchants;
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
});

export type AppRouter = typeof appRouter;
