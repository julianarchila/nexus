# PDF Generation System Documentation

## Overview

This module provides a scalable, modular solution for generating professional PDF documents from Scope data using `@react-pdf/renderer`. The system follows clean architecture principles with clear separation of concerns.

## Architecture

```
src/lib/pdf/
├── index.ts                 # Main exports
├── types.ts                 # TypeScript interfaces
├── styles.ts                # Reusable PDF styles
├── components.tsx           # Reusable PDF components
├── scope-document.tsx       # Scope document template
└── use-scope-pdf.ts         # React hook for PDF generation
```

## Core Components

### 1. Types (`types.ts`)

Defines the data structure for PDF generation:
- `ScopePDFData`: Main data structure for scope documents
- `FieldData`: Individual field configuration
- `SectionData`: Section configuration

### 2. Styles (`styles.ts`)

Professional, reusable style definitions using `@react-pdf/renderer`'s `StyleSheet.create()`:
- Clean, modern design
- Consistent spacing and typography
- Status indicators with color coding
- Responsive grid layouts

### 3. Components (`components.tsx`)

Reusable building blocks:
- `Header`: Document header with merchant info
- `Section`: Styled section container
- `Field`: Individual field display with status
- `StatusIndicator`: Visual status dots
- `Footer`: Page footer with numbering

### 4. Document Template (`scope-document.tsx`)

Main document template that assembles components:
- Uses composition pattern
- Structured with sections (Core Requirements, Metrics, Constraints, Context)
- Clean, professional layout
- Automatically formats dates, arrays, and status

### 5. Hook (`use-scope-pdf.ts`)

React hook for PDF generation and download:
- Handles blob generation
- Manages download trigger
- Loading states
- Error handling
- Toast notifications

## Usage

### Basic Usage

```tsx
import { useScopePDF } from "@/lib/pdf/use-scope-pdf";
import type { ScopePDFData } from "@/lib/pdf";

function MyComponent() {
  const { generatePDF, isGenerating } = useScopePDF();

  const handleDownload = async () => {
    const data: ScopePDFData = {
      merchantName: "Acme Corp",
      merchantId: "merchant-123",
      generatedDate: new Date(),
      scope: {
        psps: ["Stripe", "Adyen"],
        pspsStatus: "COMPLETE",
        // ... other fields
      },
    };

    await generatePDF(data);
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? "Generating..." : "Download PDF"}
    </Button>
  );
}
```

### With Custom Options

```tsx
const { generatePDF, isGenerating } = useScopePDF({
  onSuccess: () => console.log("PDF generated!"),
  onError: (error) => console.error("Failed:", error),
});

// Custom filename
await generatePDF(data, "custom-scope-report.pdf");
```

## Extending the System

### Adding a New Document Type

1. Create a new document component in `src/lib/pdf/`:

```tsx
// src/lib/pdf/implementation-document.tsx
import { Document, Page } from "@react-pdf/renderer";
import { Header, Footer, Section, Field } from "./components";
import { pdfStyles } from "./styles";

export function ImplementationDocument({ data }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Header {...data} />
        {/* Your custom sections */}
        <Footer pageNumber={1} />
      </Page>
    </Document>
  );
}
```

2. Create a specific hook if needed:

```tsx
// src/lib/pdf/use-implementation-pdf.ts
export function useImplementationPDF() {
  // Similar to useScopePDF but uses ImplementationDocument
}
```

### Adding New Components

Add reusable components to `components.tsx`:

```tsx
export function CustomComponent({ data }: CustomProps) {
  return (
    <View style={pdfStyles.yourCustomStyle}>
      <Text>{data}</Text>
    </View>
  );
}
```

### Customizing Styles

Extend `styles.ts` with new style definitions:

```tsx
export const pdfStyles = StyleSheet.create({
  // ... existing styles
  yourNewStyle: {
    fontSize: 12,
    color: "#000",
    // ... more styles
  },
});
```

## Best Practices

1. **Keep components small and focused**: Each component should have a single responsibility
2. **Use composition**: Build complex layouts from simple components
3. **Centralize styles**: Define all styles in `styles.ts` for consistency
4. **Type everything**: Use TypeScript interfaces for all data structures
5. **Handle errors gracefully**: Always provide user feedback via toasts
6. **Test with real data**: Ensure PDFs look good with various data scenarios

## Status Indicators

The system uses color-coded status indicators:
- 🟢 **COMPLETE**: Green dot (all requirements met)
- 🔴 **MISSING**: Red dot (required data missing)
- 🟡 **PARTIAL**: Amber dot (partial data)

## Multi-Page Documents

For documents spanning multiple pages:

```tsx
<Document>
  <Page size="A4" style={pdfStyles.page}>
    {/* Page 1 content */}
    <Footer pageNumber={1} />
  </Page>
  <Page size="A4" style={pdfStyles.page}>
    {/* Page 2 content */}
    <Footer pageNumber={2} />
  </Page>
</Document>
```

## Performance Considerations

- PDFs are generated on the client side
- Large documents (>20 pages) may take a few seconds
- Consider showing a loading indicator during generation
- The `isGenerating` state is automatically managed by the hook

## Troubleshooting

### PDF doesn't download
- Check browser console for errors
- Verify all required data is provided
- Ensure data types match the TypeScript interfaces

### Styling issues
- Remember: @react-pdf/renderer uses a subset of CSS
- Use flexbox for layouts
- Test across different page sizes

### Performance issues
- Reduce the number of images
- Simplify complex layouts
- Consider pagination for large datasets

## Dependencies

- `@react-pdf/renderer`: ^4.3.1
- `react`: ^19.2.1
- `sonner`: ^2.0.7 (for toasts)

## Future Enhancements

Potential improvements:
- [ ] Server-side PDF generation for larger documents
- [ ] PDF templates system
- [ ] Watermarks support
- [ ] Custom fonts
- [ ] Charts and graphs
- [ ] Email integration
- [ ] Batch PDF generation
- [ ] PDF preview before download
