import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PaymentProcessorsLoader() {
  return (
    <div className="space-y-4">
      {/* Search and filters skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-[280px] sm:max-w-md">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg bg-white overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Processor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">
                Payouts
              </TableHead>
              <TableHead className="font-semibold text-center">
                Recurring
              </TableHead>
              <TableHead className="font-semibold text-center">
                Refunds
              </TableHead>
              <TableHead className="font-semibold text-center">
                Crypto
              </TableHead>
              <TableHead className="font-semibold text-center">
                Local Inst.
              </TableHead>
              <TableHead className="font-semibold">Countries</TableHead>
              <TableHead className="font-semibold">Payment methods</TableHead>
              <TableHead className="font-semibold">PM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
