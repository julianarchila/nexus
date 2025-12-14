import { StyleSheet } from "@react-pdf/renderer";

// Reusable PDF styles following a clean, professional design
export const pdfStyles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // Header styles
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2 solid #e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },
  metaInfo: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 12,
  },

  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "1 solid #e5e7eb",
  },

  // Field styles
  field: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  criticalBadge: {
    fontSize: 7,
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 6,
  },

  // Value styles
  fieldValue: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  emptyValue: {
    fontSize: 10,
    color: "#cbd5e1",
    fontStyle: "italic",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    fontSize: 8,
    color: "#334155",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },

  // Status indicator styles
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusComplete: {
    backgroundColor: "#10b981",
  },
  statusMissing: {
    backgroundColor: "#ef4444",
  },
  statusPartial: {
    backgroundColor: "#f59e0b",
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Grid layout
  gridRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
});
