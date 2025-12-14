export type MerchantStatus = "Prospect" | "Onboarding" | "Live" | "Churned";

export interface Merchant {
  id: string;
  name: string;
  status: MerchantStatus;
  tpv: number;
  approvalRate: number;
  accountOwner: string;
  logo: string; // Emoji or URL
  description: string;
}

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: "MER-010",
    name: "MercadoLibre (MELI)",
    status: "Live",
    tpv: 50000000.00,
    approvalRate: 94.5,
    accountOwner: "Sofia Rodriguez",
    logo: "📦",
    description: "Leading e-commerce platform in Latin America"
  },
  {
    id: "MER-011",
    name: "Avianca",
    status: "Onboarding",
    tpv: 12000000.00,
    approvalRate: 88.2,
    accountOwner: "Carlos Mendez",
    logo: "✈️",
    description: "Flagship airline of Colombia"
  },
  {
    id: "MER-012",
    name: "DiDi Food",
    status: "Live",
    tpv: 8500000.00,
    approvalRate: 91.0,
    accountOwner: "Ana Silva",
    logo: "🍔",
    description: "Food delivery platform"
  },
  {
    id: "MER-013",
    name: "Falabella.com",
    status: "Prospect",
    tpv: 4200000.00,
    approvalRate: 0,
    accountOwner: "Felipe Torres",
    logo: "🛍️",
    description: "Retail giant digital transformation"
  },
  {
    id: "MER-014",
    name: "Kavak",
    status: "Churned",
    tpv: 1500000.00,
    approvalRate: 85.5,
    accountOwner: "Luis Gomez",
    logo: "🚗",
    description: "Pre-owned car marketplace"
  },
  {
    id: "MER-015",
    name: "Rappi",
    status: "Live",
    tpv: 35000000.00,
    approvalRate: 93.8,
    accountOwner: "Maria Garcia",
    logo: "🛵",
    description: "Super app for delivery and services"
  },
  {
    id: "MER-016",
    name: "McDonald's",
    status: "Live",
    tpv: 28000000.00,
    approvalRate: 96.2,
    accountOwner: "John Doe",
    logo: "🍟",
    description: "Global fast food chain"
  },
  {
    id: "MER-017",
    name: "Smart Fit",
    status: "Onboarding",
    tpv: 5500000.00,
    approvalRate: 78.4,
    accountOwner: "Patricia Lima",
    logo: "💪",
    description: "Fitness center chain"
  }
];
