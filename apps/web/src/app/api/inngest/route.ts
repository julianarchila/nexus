import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";
import { functions } from "@/core/events";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: functions,
});
