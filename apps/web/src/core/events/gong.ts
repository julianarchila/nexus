import { inngest } from "@/lib/inngest";
import {
  processGongMeeting,
  type GongEventData,
  type ChangeLog,
} from "@/core/services/gong-extractor";

/**
 * Formats the change log into a readable string for logging
 */
function formatChangeLog(changes: ChangeLog): string {
  const lines: string[] = [];

  if (changes.isNewDocument) {
    lines.push("  [NEW] Created new scope document");
  }

  // Integrations changes
  if (changes.integrations.psps.added.length > 0) {
    lines.push(`  [+] PSPs: ${changes.integrations.psps.added.join(", ")}`);
  }
  if (changes.integrations.countries.added.length > 0) {
    lines.push(
      `  [+] Countries: ${changes.integrations.countries.added.join(", ")}`,
    );
  }
  if (changes.integrations.paymentMethods.added.length > 0) {
    lines.push(
      `  [+] Payment Methods: ${changes.integrations.paymentMethods.added.join(", ")}`,
    );
  }

  // Scalar field changes
  if (changes.volumeMetrics.after) {
    if (changes.volumeMetrics.before) {
      lines.push(
        `  [~] Volume: "${changes.volumeMetrics.before}" -> "${changes.volumeMetrics.after}"`,
      );
    } else {
      lines.push(`  [+] Volume: "${changes.volumeMetrics.after}"`);
    }
  }

  if (changes.approvalRate.after) {
    if (changes.approvalRate.before) {
      lines.push(
        `  [~] Approval Rate: "${changes.approvalRate.before}" -> "${changes.approvalRate.after}"`,
      );
    } else {
      lines.push(`  [+] Approval Rate: "${changes.approvalRate.after}"`);
    }
  }

  if (changes.dealClosedBy.after) {
    if (changes.dealClosedBy.before) {
      lines.push(
        `  [~] Deal Closed By: "${changes.dealClosedBy.before}" -> "${changes.dealClosedBy.after}"`,
      );
    } else {
      lines.push(`  [+] Deal Closed By: "${changes.dealClosedBy.after}"`);
    }
  }

  if (changes.comesFromMof.after !== null) {
    if (changes.comesFromMof.before !== null) {
      lines.push(
        `  [~] From MOF: ${changes.comesFromMof.before} -> ${changes.comesFromMof.after}`,
      );
    } else {
      lines.push(`  [+] From MOF: ${changes.comesFromMof.after}`);
    }
  }

  if (lines.length === 0) {
    lines.push("  (no changes detected)");
  }

  return lines.join("\n");
}

export const gongTranscrib = inngest.createFunction(
  { id: "gong-transcrib" },
  { event: "gong/transcribe.received" },
  async ({ event, step }) => {
    const eventData = event.data as GongEventData;

    // Process the Gong meeting and extract actionable information
    const result = await step.run("extract-meeting-info", async () => {
      return processGongMeeting(eventData);
    });

    if (!result.success) {
      console.warn(`[Gong Event] Processing failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
      };
    }

    // Log detailed changes
    console.log("\n" + "=".repeat(60));
    console.log(`[Gong Event] Meeting processed for: ${result.merchantName}`);
    console.log("=".repeat(60));

    if (result.changes) {
      console.log("\nChanges detected:");
      console.log(formatChangeLog(result.changes));

      // Log current state after changes
      console.log("\nCurrent scope state:");
      console.log(
        `  PSPs: [${result.changes.integrations.psps.after.join(", ")}]`,
      );
      console.log(
        `  Countries: [${result.changes.integrations.countries.after.join(", ")}]`,
      );
      console.log(
        `  Payment Methods: [${result.changes.integrations.paymentMethods.after.join(", ")}]`,
      );
    }

    console.log(
      "\nUpdated fields:",
      result.updatedFields?.join(", ") || "none",
    );
    console.log("=".repeat(60) + "\n");

    return {
      success: true,
      merchantId: result.merchantId,
      merchantName: result.merchantName,
      updatedFields: result.updatedFields,
      changes: result.changes,
      extractedData: result.extractedData,
    };
  },
);
