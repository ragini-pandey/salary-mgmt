import { Building2, Globe2, Users, Briefcase } from "lucide-react";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import type { OrganizationStats } from "@/lib/services/insights";

const ITEMS: Array<{
  key: keyof OrganizationStats;
  label: string;
  icon: typeof Users;
  tint: string;
}> = [
  {
    key: "totalEmployees",
    label: "Active employees",
    icon: Users,
    tint: "from-indigo-500/15 to-indigo-500/0 text-indigo-600",
  },
  {
    key: "countries",
    label: "Countries",
    icon: Globe2,
    tint: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
  },
  {
    key: "departments",
    label: "Departments",
    icon: Building2,
    tint: "from-amber-500/15 to-amber-500/0 text-amber-600",
  },
  {
    key: "jobTitles",
    label: "Distinct job titles",
    icon: Briefcase,
    tint: "from-rose-500/15 to-rose-500/0 text-rose-600",
  },
];

export function OrgKpis({ stats }: { stats: OrganizationStats }) {
  return (
    <AnimatedGrid className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ITEMS.map(({ key, label, icon: Icon, tint }) => (
        <Card
          key={key}
          className="relative overflow-hidden transition-shadow hover:shadow-md"
        >
          <div
            className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-xl ${tint.split(" text-")[0]}`}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{label}</CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${tint}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums tracking-tight">
              <CountUp value={stats[key]} />
            </p>
          </CardContent>
        </Card>
      ))}
    </AnimatedGrid>
  );
}
