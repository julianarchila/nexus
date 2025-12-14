import { inngest } from "@/lib/inngest";
import { serve } from "inngest/next";

// Import new ingestion functions
import { gongAdapter, processEvent, applyExtraction } from "@/core/ingestion";

// Import legacy functions (will be deprecated)
import { functions as legacyFunctions } from "@/core/events";

// Combine all functions
const allFunctions = [
  // New ingestion pipeline
  gongAdapter,
  processEvent,
  applyExtraction,
  // Legacy functions (TODO: remove after migration)
  ...legacyFunctions,
];

// Create an API that serves all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});
