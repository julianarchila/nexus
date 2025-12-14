import { eq, inArray } from "drizzle-orm";
import { db } from "@/core/db/client";
import {
  countryProcessorFeatures,
  paymentProcessors,
  type TransitionWarning,
} from "@/core/db/schema";

/**
 * Platform support checker
 *
 * Checks whether the PSPs and payment methods specified in a merchant's scope
 * are actually supported by the Yuno platform (paymentProcessors and countryProcessorFeatures tables).
 *
 * This is used during SCOPING → IMPLEMENTING transition to warn users about
 * new integrations that may be required.
 */

export interface PlatformSupportResult {
  /** All items are supported by the platform */
  fullySupported: boolean;

  /** Warnings about unsupported items */
  warnings: TransitionWarning[];

  /** PSPs that are supported (status = LIVE) */
  supportedPsps: string[];

  /** PSPs that are not in the platform or not LIVE */
  unsupportedPsps: string[];

  /** Payment methods that are supported by at least one PSP */
  supportedPaymentMethods: string[];

  /** Payment methods not supported by any PSP */
  unsupportedPaymentMethods: string[];
}

export interface ScopeForPlatformCheck {
  psps: string[];
  payment_methods: string[];
}

/**
 * Check if the PSPs and payment methods in a scope are supported by the platform.
 *
 * PSP support: Checks if the PSP exists in paymentProcessors with status "LIVE"
 * Payment method support: Checks if any LIVE PSP supports the payment method
 */
export async function checkPlatformSupport(
  scope: ScopeForPlatformCheck,
): Promise<PlatformSupportResult> {
  const warnings: TransitionWarning[] = [];
  const supportedPsps: string[] = [];
  const unsupportedPsps: string[] = [];
  const supportedPaymentMethods: string[] = [];
  const unsupportedPaymentMethods: string[] = [];

  // Get all PSPs from the platform
  const psps = scope.psps || [];
  if (psps.length > 0) {
    const platformPsps = await db
      .select()
      .from(paymentProcessors)
      .where(inArray(paymentProcessors.id, psps));

    const platformPspMap = new Map(platformPsps.map((p) => [p.id, p]));

    for (const pspId of psps) {
      const platformPsp = platformPspMap.get(pspId);

      if (!platformPsp) {
        // PSP doesn't exist in platform at all
        unsupportedPsps.push(pspId);
        warnings.push({
          type: "PSP_NOT_SUPPORTED",
          processor_id: pspId,
          message: `PSP "${pspId}" is not in the platform. A new integration will be required.`,
        });
      } else if (platformPsp.status !== "LIVE") {
        // PSP exists but is not LIVE
        unsupportedPsps.push(pspId);
        warnings.push({
          type: "PSP_NOT_SUPPORTED",
          processor_id: pspId,
          message: `PSP "${platformPsp.name}" is ${platformPsp.status}. Integration may not be ready.`,
        });
      } else {
        supportedPsps.push(pspId);
      }
    }
  }

  // Get all supported payment methods from LIVE PSPs
  const paymentMethods = scope.payment_methods || [];
  if (paymentMethods.length > 0) {
    // Get all country processor features for LIVE PSPs
    const livePspIds = await db
      .select({ id: paymentProcessors.id })
      .from(paymentProcessors)
      .where(eq(paymentProcessors.status, "LIVE"));

    const livePspIdList = livePspIds.map((p) => p.id);

    if (livePspIdList.length > 0) {
      const countryFeatures = await db
        .select()
        .from(countryProcessorFeatures)
        .where(inArray(countryProcessorFeatures.processor_id, livePspIdList));

      // Collect all supported payment methods across all countries and PSPs
      const allSupportedMethods = new Set<string>();
      for (const feature of countryFeatures) {
        if (feature.status === "LIVE" && feature.supported_methods) {
          for (const method of feature.supported_methods) {
            allSupportedMethods.add(method.toLowerCase());
          }
        }
      }

      for (const method of paymentMethods) {
        const normalizedMethod = method.toLowerCase();
        if (allSupportedMethods.has(normalizedMethod)) {
          supportedPaymentMethods.push(method);
        } else {
          unsupportedPaymentMethods.push(method);
          warnings.push({
            type: "PAYMENT_METHOD_NOT_SUPPORTED",
            payment_method: method,
            message: `Payment method "${method}" is not currently supported by any LIVE PSP. A new integration may be required.`,
          });
        }
      }
    } else {
      // No LIVE PSPs at all
      for (const method of paymentMethods) {
        unsupportedPaymentMethods.push(method);
        warnings.push({
          type: "PAYMENT_METHOD_NOT_SUPPORTED",
          payment_method: method,
          message: `Payment method "${method}" cannot be verified - no LIVE PSPs in platform.`,
        });
      }
    }
  }

  return {
    fullySupported: warnings.length === 0,
    warnings,
    supportedPsps,
    unsupportedPsps,
    supportedPaymentMethods,
    unsupportedPaymentMethods,
  };
}

/**
 * Determines if a specific PSP is supported by the platform
 */
export async function isPspSupported(pspId: string): Promise<boolean> {
  const psp = await db
    .select()
    .from(paymentProcessors)
    .where(eq(paymentProcessors.id, pspId))
    .limit(1);

  return psp.length > 0 && psp[0].status === "LIVE";
}

/**
 * Determines if a specific payment method is supported by any LIVE PSP
 */
export async function isPaymentMethodSupported(
  paymentMethod: string,
): Promise<boolean> {
  const livePspIds = await db
    .select({ id: paymentProcessors.id })
    .from(paymentProcessors)
    .where(eq(paymentProcessors.status, "LIVE"));

  if (livePspIds.length === 0) return false;

  const livePspIdList = livePspIds.map((p) => p.id);
  const features = await db
    .select()
    .from(countryProcessorFeatures)
    .where(inArray(countryProcessorFeatures.processor_id, livePspIdList));

  const normalizedMethod = paymentMethod.toLowerCase();

  for (const feature of features) {
    if (feature.status === "LIVE" && feature.supported_methods) {
      for (const method of feature.supported_methods) {
        if (method.toLowerCase() === normalizedMethod) {
          return true;
        }
      }
    }
  }

  return false;
}
