"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ page, pageSize, total }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function goto(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    router.push(`/employees?${next.toString()}`);
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-zinc-500">
        Showing <span className="font-medium text-zinc-700">{start}</span>–
        <span className="font-medium text-zinc-700">{end}</span> of{" "}
        <span className="font-medium text-zinc-700">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goto(page - 1)}
        >
          Previous
        </Button>
        <span className="text-zinc-500">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goto(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
