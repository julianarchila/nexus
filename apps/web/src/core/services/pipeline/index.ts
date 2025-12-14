// Pipeline services - manage merchant lifecycle transitions

export {
  calculateImplementationReadiness,
  type ImplementationReadinessResult,
  type PaymentMethodImplementationSummary,
  type PspImplementationSummary,
} from "./implementation-readiness";

export {
  checkPlatformSupport,
  isPaymentMethodSupported,
  isPspSupported,
  type PlatformSupportResult,
  type ScopeForPlatformCheck,
} from "./platform-support-checker";

export {
  CRITICAL_FIELDS,
  calculateScopeReadiness,
  type FieldReadiness,
  getScopeFieldLabel,
  type ScopeData,
  type ScopeField,
  type ScopeReadinessResult,
} from "./scope-readiness";

export {
  previewTransitionToImplementing,
  previewTransitionToLive,
  type TransitionPreviewResult,
  type TransitionResult,
  type TransitionToImplementingInput,
  type TransitionToLiveInput,
  transitionToImplementing,
  transitionToLive,
} from "./stage-transition";
