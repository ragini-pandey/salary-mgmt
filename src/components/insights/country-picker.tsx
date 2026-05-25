"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryName } from "@/lib/utils/country";

export function CountryPicker({
  countries,
  selected,
}: {
  countries: string[];
  selected?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(v: string) {
    const next = new URLSearchParams(params.toString());
    next.set("country", v);
    router.push(`/insights?${next.toString()}`);
  }

  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Choose a country" />
      </SelectTrigger>
      <SelectContent>
        {countries.map((c) => (
          <SelectItem key={c} value={c}>
            {countryName(c)} ({c})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
