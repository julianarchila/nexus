import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ScopePDFData } from "./types";
import { pdfStyles } from "./styles";
import { Field, Footer, Header, Section } from "./components";

interface ScopeDocumentProps {
    data: ScopePDFData;
}

export function ScopeDocument({ data }: ScopeDocumentProps) {
    const { merchantName, merchantId, generatedDate, scope } = data;

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                <Header
                    merchantName={merchantName}
                    merchantId={merchantId}
                    generatedDate={generatedDate}
                />

                {/* Core Requirements */}
                <Section title="Core Requirements">
                    <Field
                        field={{
                            label: "Payment Service Providers (PSPs)",
                            value: scope.psps,
                            status: scope.pspsStatus,
                            isCritical: true,
                        }}
                    />
                    <Field
                        field={{
                            label: "Countries",
                            value: scope.countries,
                            status: scope.countriesStatus,
                            isCritical: true,
                        }}
                    />
                    <Field
                        field={{
                            label: "Payment Methods",
                            value: scope.paymentMethods,
                            status: scope.paymentMethodsStatus,
                            isCritical: true,
                        }}
                    />
                </Section>

                {/* Metrics */}
                <Section title="Metrics">
                    <View style={pdfStyles.gridRow}>
                        <View style={pdfStyles.gridCol}>
                            <Field
                                field={{
                                    label: "Expected Volume",
                                    value: scope.expectedVolume,
                                    status: scope.expectedVolumeStatus,
                                }}
                            />
                        </View>
                        <View style={pdfStyles.gridCol}>
                            <Field
                                field={{
                                    label: "Expected Approval Rate",
                                    value: scope.expectedApprovalRate,
                                    status: scope.expectedApprovalRateStatus,
                                }}
                            />
                        </View>
                    </View>
                </Section>

                {/* Constraints */}
                <Section title="Constraints">
                    <Field
                        field={{
                            label: "Restrictions",
                            value: scope.restrictions,
                            status: scope.restrictionsStatus,
                        }}
                    />
                    <Field
                        field={{
                            label: "Dependencies",
                            value: scope.dependencies,
                            status: scope.dependenciesStatus,
                        }}
                    />
                    <Field
                        field={{
                            label: "Compliance Requirements",
                            value: scope.complianceRequirements,
                            status: scope.complianceStatus,
                        }}
                    />
                </Section>

                {/* Context */}
                <Section title="Context">
                    <Field
                        field={{
                            label: "Expected Go-Live Date",
                            value: scope.expectedGoLiveDate
                                ? scope.expectedGoLiveDate.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })
                                : null,
                            status: scope.goLiveDateStatus,
                        }}
                    />
                    <View style={pdfStyles.gridRow}>
                        <View style={pdfStyles.gridCol}>
                            <Field
                                field={{
                                    label: "Comes from MOR",
                                    value: scope.comesFromMor ? "Yes" : "No",
                                    status: "COMPLETE",
                                }}
                            />
                        </View>
                        <View style={pdfStyles.gridCol}>
                            <Field
                                field={{
                                    label: "Deal Closed By",
                                    value: scope.dealClosedBy,
                                    status: scope.dealClosedBy ? "COMPLETE" : "MISSING",
                                }}
                            />
                        </View>
                    </View>
                </Section>

                {/* Summary */}
                <View style={pdfStyles.section}>
                    <Text style={pdfStyles.sectionHeader}>Summary</Text>
                    <View style={pdfStyles.field}>
                        <Text style={pdfStyles.fieldValue}>
                            This document outlines the scope requirements for {merchantName}.
                            All critical fields (PSPs, Countries, Payment Methods) must be
                            completed before moving to the implementation phase.
                        </Text>
                    </View>
                </View>

                <Footer pageNumber={1} />
            </Page>
        </Document>
    );
}
