import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";
import {
  gongAdapter,
  gmailAdapter,
  gmailComposioAdapter,
  processEvent,
  applyExtraction,
} from "@/core/workflows";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    gongAdapter,
    gmailAdapter,
    gmailComposioAdapter,
    processEvent,
    applyExtraction,
  ],
});
