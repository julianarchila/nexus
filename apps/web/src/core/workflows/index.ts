/**
 * Workflows Index
 *
 * Exports all Inngest workflow functions for event processing and data extraction.
 * These workflows orchestrate the data pipeline: ingestion → extraction → application.
 */

export { gmailComposioAdapter } from "./adapters/gmail-composio.adapter";
export { gmailAdapter } from "./adapters/gmail.adapter";
export { gongAdapter } from "./adapters/gong.adapter";
export { applyExtraction } from "./apply-extraction";
export { generateEventEmbedding } from "./generate-embedding";
export { processEvent } from "./process-event";
