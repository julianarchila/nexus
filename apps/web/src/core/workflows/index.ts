/**
 * Workflows Index
 *
 * Exports all Inngest workflow functions for event processing and data extraction.
 * These workflows orchestrate the data pipeline: ingestion → extraction → application.
 */

export { gmailAdapter } from "./adapters/gmail.adapter";
export { gongAdapter } from "./adapters/gong.adapter";
export { processEvent } from "./process-event";
export { applyExtraction } from "./apply-extraction";
