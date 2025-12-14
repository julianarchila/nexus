import { Text, View } from "@react-pdf/renderer";
import type { FieldData } from "./types";
import { pdfStyles } from "./styles";

// Reusable PDF Components

interface StatusIndicatorProps {
  status: string;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const getStatusStyle = () => {
    if (status === "COMPLETE") return pdfStyles.statusComplete;
    if (status === "MISSING") return pdfStyles.statusMissing;
    return pdfStyles.statusPartial;
  };

  return (
    <View style={pdfStyles.statusContainer}>
      <View style={[pdfStyles.statusDot, getStatusStyle()]} />
    </View>
  );
}

interface FieldProps {
  field: FieldData;
}

export function Field({ field }: FieldProps) {
  const { label, value, status, isCritical } = field;
  const isEmpty =
    !value || (Array.isArray(value) && value.length === 0) || value === "";

  return (
    <View style={pdfStyles.field}>
      <View style={pdfStyles.fieldHeader}>
        <Text style={pdfStyles.fieldLabel}>{label}</Text>
        {isCritical && (
          <Text style={pdfStyles.criticalBadge}>REQUIRED</Text>
        )}
        <StatusIndicator status={status} />
      </View>

      <View>
        {isEmpty ? (
          <Text style={pdfStyles.emptyValue}>Not specified</Text>
        ) : Array.isArray(value) ? (
          <View style={pdfStyles.tagContainer}>
            {value.map((item, index) => (
              <Text key={index} style={pdfStyles.tag}>
                {item}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={pdfStyles.fieldValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

interface HeaderProps {
  merchantName: string;
  merchantId: string;
  generatedDate: Date;
}

export function Header({ merchantName, merchantId, generatedDate }: HeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <Text style={pdfStyles.title}>Scope Documentation</Text>
      <Text style={pdfStyles.subtitle}>{merchantName}</Text>
      <Text style={pdfStyles.subtitle}>ID: {merchantId}</Text>
      <Text style={pdfStyles.metaInfo}>
        Generated on {generatedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

interface FooterProps {
  pageNumber: number;
}

export function Footer({ pageNumber }: FooterProps) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>Nexus - Scope Documentation</Text>
      <Text>Page {pageNumber}</Text>
    </View>
  );
}
