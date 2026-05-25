import { Building2, Globe2, Users, Briefcase } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationStats } from "@/lib/services/insights";

const ICONS = {
  totalEmployees: Users,
  countries: Globe2,
  departments: Building2,
  jobTitles: Briefcase,
} as const;

const LABELS = {
  totalEmployees: "Active employees",
  countries: "Countries",
  departments: "Departments",
  jobTitles: "Distinct job titles",
} as const;

export function OrgKpis({ stats }: { stats: OrganizationStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {(Object.keys(LABELS) as Array<keyof typeof LABELS>).map((key) => {
        const Icon = ICONS[key];
        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{LABELS[key]}</CardTitle>
              <Icon className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats[key].toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
