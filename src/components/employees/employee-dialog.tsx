"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Employee } from "@/lib/db/schema";

import { EmployeeForm } from "./employee-form";

interface CreateProps {
  mode: "create";
}
interface EditProps {
  mode: "edit";
  employee: Employee;
  trigger: React.ReactNode;
}
type Props = CreateProps | EditProps;

export function EmployeeDialogButton(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.mode === "create" ? (
          <Button>
            <Plus className="h-4 w-4" />
            Add employee
          </Button>
        ) : (
          props.trigger
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "Add employee" : "Edit employee"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Create a new employee record."
              : `Editing ${props.employee.fullName}.`}
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm
          employee={props.mode === "edit" ? props.employee : undefined}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
