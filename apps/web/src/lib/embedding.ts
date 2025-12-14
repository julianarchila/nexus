import { embed } from "ai";

import { gemini } from "./model";

/**
 * Embedding model configuration
 * Using Gemini's text-embedding-004 model which produces 768-dimensional vectors
 */
const embeddingModel = gemini.textEmbeddingModel("text-embedding-004");

/**
 * Generate an embedding vector for the given text
 * @param text - The text to embed
 * @returns A 768-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 * @param texts - Array of texts to embed
 * @returns Array of 768-dimensional embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map((text) =>
      embed({
        model: embeddingModel,
        value: text,
      }),
    ),
  );

  return results.map((r) => r.embedding);
}

/**
 * Prepares event content for embedding by combining relevant fields
 * @param rawContent - The raw content of the event
 * @param metadata - Event metadata (title, subject, from, etc.)
 * @returns A single string suitable for embedding
 */
export function prepareEventTextForEmbedding(
  rawContent: string,
  metadata: Record<string, unknown> | null,
): string {
  const parts: string[] = [];

  // Add metadata context if available
  if (metadata) {
    // Meeting title
    if (typeof metadata.title === "string" && metadata.title) {
      parts.push(`Title: ${metadata.title}`);
    }

    // Email subject
    if (typeof metadata.subject === "string" && metadata.subject) {
      parts.push(`Subject: ${metadata.subject}`);
    }

    // Sender info
    if (typeof metadata.from === "string" && metadata.from) {
      parts.push(`From: ${metadata.from}`);
    }
  }

  // Add the main content
  parts.push(rawContent);

  return parts.join("\n\n");
}
