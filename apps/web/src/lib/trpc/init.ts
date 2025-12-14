import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export const createTRPCContext = async () => {
  return {};
};

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
