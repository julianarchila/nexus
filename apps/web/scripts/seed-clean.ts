import "dotenv/config";
import { db } from "../src/core/db/client";
import {
  aiExtraction,
  attachment,
  auditLog,
  countryProcessorFeatures,
  inboundEvent,
  merchantPaymentMethodImplementation,
  merchantProfile,
  merchantPspImplementation,
  paymentProcessors,
  scopeInDoc,
  stageTransition,
} from "../src/core/db/schema";

/**
 * Clean all seed data from the database
 * Tables are deleted in reverse dependency order to avoid foreign key constraint errors
 */
async function cleanDatabase() {
  try {
    console.log("🧹 Starting database cleanup...");
    console.log(
      "⚠️  This will DELETE ALL records from all tables in the database!\n",
    );

    // ==========================================
    // DELETE IN REVERSE DEPENDENCY ORDER
    // ==========================================

    // 1. Audit Log (references aiExtraction and merchantProfile)
    console.log("🗑️  Deleting audit log entries...");
    await db.delete(auditLog);
    console.log("✅ Audit log cleared");

    // 2. AI Extractions (references inboundEvent and merchantProfile)
    console.log("🗑️  Deleting AI extractions...");
    await db.delete(aiExtraction);
    console.log("✅ AI extractions cleared");

    // 3. Inbound Events (references merchantProfile)
    console.log("🗑️  Deleting inbound events...");
    await db.delete(inboundEvent);
    console.log("✅ Inbound events cleared");

    // 4. Attachments (references merchantProfile)
    console.log("🗑️  Deleting attachments...");
    await db.delete(attachment);
    console.log("✅ Attachments cleared");

    // 5. Scope In Doc (references merchantProfile)
    console.log("🗑️  Deleting scope documents...");
    await db.delete(scopeInDoc);
    console.log("✅ Scope documents cleared");

    // 6. Merchant PSP Implementation (references merchantProfile)
    console.log("🗑️  Deleting merchant PSP implementations...");
    await db.delete(merchantPspImplementation);
    console.log("✅ Merchant PSP implementations cleared");

    // 7. Merchant Payment Method Implementation (references merchantProfile)
    console.log("🗑️  Deleting merchant payment method implementations...");
    await db.delete(merchantPaymentMethodImplementation);
    console.log("✅ Merchant payment method implementations cleared");

    // 8. Stage Transitions (references merchantProfile)
    console.log("🗑️  Deleting stage transitions...");
    await db.delete(stageTransition);
    console.log("✅ Stage transitions cleared");

    // 9. Merchant Profiles (parent table, delete after all children)
    console.log("🗑️  Deleting merchant profiles...");
    await db.delete(merchantProfile);
    console.log("✅ Merchant profiles cleared");

    // 10. Country Processor Features (references paymentProcessors)
    console.log("🗑️  Deleting country processor features...");
    await db.delete(countryProcessorFeatures);
    console.log("✅ Country processor features cleared");

    // 11. Payment Processors (delete last, after countryProcessorFeatures)
    console.log("🗑️  Deleting payment processors...");
    await db.delete(paymentProcessors);
    console.log("✅ Payment processors cleared");

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("\n🎉 Database cleanup completed successfully!");
    console.log("\n📊 CLEANUP SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log("All records have been deleted from:");
    console.log("  • audit_log");
    console.log("  • ai_extraction");
    console.log("  • inbound_event");
    console.log("  • attachment");
    console.log("  • scope_in_doc");
    console.log("  • merchant_psp_implementation");
    console.log("  • merchant_payment_method_implementation");
    console.log("  • stage_transition");
    console.log("  • merchant_profile");
    console.log("  • country_processor_features");
    console.log("  • payment_processors");
    console.log("═══════════════════════════════════════");
    console.log("✨ Database is now clean and ready for fresh seeding!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    process.exit(1);
  }
}

cleanDatabase();
