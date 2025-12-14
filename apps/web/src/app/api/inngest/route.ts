import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";
import {
  gongAdapter,
  gmailAdapter,
  processEvent,
  applyExtraction,
} from "@/core/ingestion";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [gongAdapter, gmailAdapter, processEvent, applyExtraction],
});
