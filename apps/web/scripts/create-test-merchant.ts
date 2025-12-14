import { db } from "@/core/db/client";
import { merchantProfile, scopeInDoc } from "@/core/db/schema";
import { nanoid } from "nanoid";

async function createTestMerchant() {
  const merchantId = nanoid();
  const scopeId = nanoid();

  // Create merchant
  await db.insert(merchantProfile).values({
    id: merchantId,
    name: "Test Merchant - Diego",
    contact_email: "diegofernandoaguirretenjo@gmail.com",
    contact_name: "Diego Aguirre",
    lifecycle_stage: "SCOPING",
    sales_owner: "test-sales",
  });

  console.log(`✅ Created merchant: ${merchantId}`);

  // Create scope document
  await db.insert(scopeInDoc).values({
    id: scopeId,
    merchant_id: merchantId,
    psps: ["stripe"],
    countries: ["US"],
    payment_methods: ["credit_card"],
    is_complete: false,
  });

  console.log(`✅ Created scope document: ${scopeId}`);
  console.log(`\n🎉 Test merchant ready!`);
  console.log(`   Email: diegofernandoaguirretenjo@gmail.com`);
  console.log(`   Name: Test Merchant - Diego`);
}

createTestMerchant()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
