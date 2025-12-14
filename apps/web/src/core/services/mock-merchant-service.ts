import { MerchantData } from "@/core/types/merchant";

// Utility to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_RAPPI_DATA: MerchantData = {
  profile: {
    id: "MER-015",
    name: "Rappi",
    legalName: "Rappi Inc.",
    taxId: "900.123.456-7",
    industry: "Delivery & Services",
    website: "https://www.rappi.com",
    description: "Super app for delivery and services across Latin America.",
    logo: "🛵",
    status: "Live",
    accountOwner: {
      name: "Maria Garcia",
      email: "maria.garcia@y.uno",
    },
    metrics: {
      tpv: 35000000.00,
      approvalRate: 93.8,
      chargebackRate: 0.4,
    },
  },
  scoping: [
    {
      id: "TS-001",
      category: "PSP",
      name: "Stripe",
      status: "Integrated",
      region: ["MX", "BR"],
      notes: "Primary processor for cards",
    },
    {
      id: "TS-002",
      category: "PSP",
      name: "Adyen",
      status: "Integrated",
      region: ["CO", "PE"],
      notes: "Backup processor",
    },
    {
      id: "TS-003",
      category: "Payment Method",
      name: "Pix",
      status: "Integrated",
      region: ["BR"],
    },
    {
      id: "TS-004",
      category: "Fraud",
      name: "ClearSale",
      status: "Required",
      region: ["LATAM"],
      notes: "Pending integration credentials",
    },
  ],
  attachments: [
    {
      id: "DOC-001",
      name: "MSA_Signed_Rappi_2024.pdf",
      type: "Contract",
      url: "#",
      uploadedAt: "2024-01-15T10:00:00Z",
      size: "2.4 MB",
    },
    {
      id: "DOC-002",
      name: "Technical_Requirements_v2.docx",
      type: "Technical Doc",
      url: "#",
      uploadedAt: "2024-02-10T14:30:00Z",
      size: "1.1 MB",
    },
  ],
  activityLog: [
    {
      id: "LOG-001",
      type: "User",
      message: "Updated approval rate target to 95%",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "LOG-002",
      type: "System",
      message: "Weekly volume report generated",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "LOG-003",
      type: "AI",
      message: "Detected potential savings of $12k/mo by routing Amex to Adyen in Colombia",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
  ],
};

// Fallback for other IDs for demo purposes
const MOCK_GENERIC_DATA = (id: string): MerchantData => ({
  ...MOCK_RAPPI_DATA,
  profile: {
    ...MOCK_RAPPI_DATA.profile,
    id,
    name: "Demo Merchant",
    legalName: "Demo Merchant Inc.",
  },
});

export const mockMerchantService = {
  getMerchant: async (id: string): Promise<MerchantData> => {
    await delay(800); // Simulate 800ms latency
    
    if (id === "MER-015" || id === "rappi") {
      return JSON.parse(JSON.stringify(MOCK_RAPPI_DATA)); // Return deep copy
    }
    
    return JSON.parse(JSON.stringify(MOCK_GENERIC_DATA(id)));
  },
};
