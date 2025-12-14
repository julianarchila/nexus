import { db } from "@/core/db/client";
import { merchant_profile } from "@/core/db/schema";
import { publicProcedure, router } from "./init";

export const appRouter = router({
  merchants: router({
    list: publicProcedure.query(async () => {
      const merchants = await db.select().from(merchant_profile);
      return merchants;
    }),
  }),
});

export type AppRouter = typeof appRouter;
