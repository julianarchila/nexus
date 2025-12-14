import {
  applyExtraction,
  generateEventEmbedding,
  gmailAdapter,
  gmailComposioAdapter,
  gongAdapter,
  processEvent,
} from "@/core/workflows";
import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    gongAdapter,
    gmailAdapter,
    gmailComposioAdapter,
    processEvent,
    applyExtraction,
    generateEventEmbedding,
  ],
});
