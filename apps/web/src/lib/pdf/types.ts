// PDF Types for Scope Documentation

export interface ScopePDFData {
    merchantName: string;
    merchantId: string;
    generatedDate: Date;
    scope: {
        // Core Requirements
        psps: string[];
        pspsStatus: string;
        countries: string[];
        countriesStatus: string;
        paymentMethods: string[];
        paymentMethodsStatus: string;

        // Metrics
        expectedVolume: string | null;
        expectedVolumeStatus: string;
        expectedApprovalRate: string | null;
        expectedApprovalRateStatus: string;

        // Constraints
        restrictions: string[];
        restrictionsStatus: string;
        dependencies: string[];
        dependenciesStatus: string;
        complianceRequirements: string[];
        complianceStatus: string;

        // Context
        expectedGoLiveDate: Date | null;
        goLiveDateStatus: string;
        comesFromMor: boolean;
        dealClosedBy: string | null;
    };
}

export interface SectionData {
    title: string;
    fields: FieldData[];
}

export interface FieldData {
    label: string;
    value: string | string[] | null;
    status: string;
    isCritical?: boolean;
}
