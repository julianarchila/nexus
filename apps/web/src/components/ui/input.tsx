import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#8898aa] selection:bg-primary selection:text-primary-foreground border-[#e6ebf1] h-9 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[#635bff] focus-visible:ring-[#635bff]/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
