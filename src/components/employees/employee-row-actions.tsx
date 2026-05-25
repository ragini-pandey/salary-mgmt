"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Employee } from "@/lib/db/schema";

import { EmployeeDialogButton } from "./employee-dialog";

export function EmployeeRowActions({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <EmployeeDialogButton
        mode="edit"
        employee={employee}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DeleteDialog
        employee={employee}
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        }
      />
      <span className="sr-only">
        <MoreHorizontal />
      </span>
    </div>
  );
}

function DeleteDialog({
  employee,
  open,
  onOpenChange,
  trigger,
}: {
  employee: Employee;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (res.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {employee.fullName}?</DialogTitle>
          <DialogDescription>
            This permanently removes the record. The action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
