export interface MerchantProfile {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  industry: string;
  website: string;
  description: string;
  logo: string; // Emoji or URL
  status: "Prospect" | "Onboarding" | "Live" | "Churned";
  accountOwner: {
    name: string;
    email: string;
    avatar?: string;
  };
  metrics: {
    tpv: number; // Total Processed Volume
    approvalRate: number;
    chargebackRate: number;
  };
}

export interface TechSpec {
  id: string;
  category: "PSP" | "Payment Method" | "Fraud" | "Payouts";
  name: string;
  status: "Required" | "Integrated" | "Pending" | "Not Supported";
  region: string[];
  notes?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "Contract" | "NDA" | "Technical Doc" | "Other";
  url: string;
  uploadedAt: string;
  size: string;
}

export interface ActivityLog {
  id: string;
  type: "System" | "User" | "AI";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MerchantData {
  profile: MerchantProfile;
  scoping: TechSpec[];
  attachments: Attachment[];
  activityLog: ActivityLog[];
}
