import { db } from "@/core/db/client";
import { merchantProfile } from "@/core/db/schema";
import { eq, ilike } from "drizzle-orm";
import type { MerchantHints } from "../adapters/types";

export interface ResolvedMerchant {
  id: string;
  name: string;
}

/**
 * Normaliza un email para búsqueda consistente
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Strategy interface for merchant resolution
 */
interface MerchantResolutionStrategy {
  canResolve(hints: MerchantHints): boolean;
  resolve(hints: MerchantHints): Promise<ResolvedMerchant | null>;
}

/**
 * Strategy 1: Resolve by direct merchant ID
 */
class DirectIdStrategy implements MerchantResolutionStrategy {
  canResolve(hints: MerchantHints): boolean {
    return !!hints.merchantId;
  }

  async resolve(hints: MerchantHints): Promise<ResolvedMerchant | null> {
    if (!hints.merchantId) return null;

    const [merchant] = await db
      .select()
      .from(merchantProfile)
      .where(eq(merchantProfile.id, hints.merchantId))
      .limit(1);

    if (!merchant) return null;

    return {
      id: merchant.id,
      name: merchant.name,
    };
  }
}

/**
 * Strategy 2: Resolve by contact email
 * Busca el merchant por el email de la persona que envió el correo
 * comparándolo con el contact_email del merchant profile
 */
class EmailStrategy implements MerchantResolutionStrategy {
  canResolve(hints: MerchantHints): boolean {
    return !!hints.email;
  }

  async resolve(hints: MerchantHints): Promise<ResolvedMerchant | null> {
    if (!hints.email) return null;

    // Normalizar el email para búsqueda case-insensitive
    const normalizedEmail = normalizeEmail(hints.email);

    console.log(`[MerchantResolver] Buscando merchant con email: ${normalizedEmail}`);

    // Buscar merchant donde el contact_email coincida (case-insensitive)
    const [merchant] = await db
      .select()
      .from(merchantProfile)
      .where(ilike(merchantProfile.contact_email, normalizedEmail))
      .limit(1);

    if (!merchant) {
      console.log(`[MerchantResolver] No se encontró merchant para el email: ${normalizedEmail}`);
      return null;
    }

    console.log(`[MerchantResolver] ✓ Merchant encontrado: ${merchant.name} (${merchant.id})`);

    return {
      id: merchant.id,
      name: merchant.name,
    };
  }
}

// Future strategies can be added here:
// - SlackChannelStrategy
// - DomainStrategy (extract domain from email and match)
// - SalesforceAccountStrategy

/**
 * Strategies in priority order
 */
const strategies: MerchantResolutionStrategy[] = [
  new DirectIdStrategy(),
  new EmailStrategy(),
];

/**
 * Resolves a merchant using available hints and pluggable strategies
 */
export async function resolveMerchant(
  hints: MerchantHints,
): Promise<ResolvedMerchant | null> {
  for (const strategy of strategies) {
    if (strategy.canResolve(hints)) {
      const merchant = await strategy.resolve(hints);
      if (merchant) {
        return merchant;
      }
    }
  }

  return null;
}
