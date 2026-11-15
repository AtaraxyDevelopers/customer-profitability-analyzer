import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "customer-profitability-analyzer",
  title: "Customer Profitability Analyzer",
  description:
    "Understand which customer relationships support sustainable delivery.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Customer profit = period revenue − delivery hours × loaded hourly cost − other direct costs − allocated overhead. Use the same period for every record; hours are costs, not billing rates.",
  port: 4427,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Customer / business name",
      type: "text",
    },
    {
      key: "revenue",
      label: "Revenue in period",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "hours",
      label: "Delivery hours",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "hourlyCost",
      label: "Loaded labor cost per hour",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "directCosts",
      label: "Other direct costs",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "overhead",
      label: "Allocated overhead",
      type: "number",
      min: 0,
      max: 100000000,
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "targetMargin",
      label: "Target customer margin (%)",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "period",
      label: "Reporting period",
      type: "text",
    },
  ],
  actions: [],
  document: false,
};

export const example = {
  schemaVersion: 1,
  project: "customer-profitability-analyzer",
  settings: {
    currency: "USD",
    targetMargin: 25,
    period: "November 2026",
  },
  records: [
    {
      id: "client-1",
      name: "Maple Studio",
      revenue: 5000,
      hours: 80,
      hourlyCost: 30,
      directCosts: 500,
      overhead: 300,
    },
    {
      id: "client-2",
      name: "River Foods",
      revenue: 2000,
      hours: 60,
      hourlyCost: 30,
      directCosts: 300,
      overhead: 200,
    },
  ],
};
export function analyze(records, s) {
  const rows = records.map((r) => {
    const cost = r.hours * r.hourlyCost + r.directCosts + r.overhead;
    return {
      id: r.id,
      Customer: r.name,
      Revenue: money(r.revenue),
      "Total cost": money(cost),
      Profit: money(r.revenue - cost),
      "Margin (%)": ratio(r.revenue - cost, r.revenue) ?? "N/A",
      "Revenue / hour": r.hours ? money(r.revenue / r.hours) : "N/A",
    };
  });
  return {
    metrics: [
      metric(
        "Period revenue",
        money(sum(records.map((r) => r.revenue))),
        s.currency,
      ),
      metric(
        "Period profit",
        money(sum(rows.map((r) => Number(r.Profit)))),
        s.currency,
      ),
      metric(
        "Below target",
        rows.filter(
          (r) => r["Margin (%)"] === "N/A" || r["Margin (%)"] < s.targetMargin,
        ).length,
      ),
    ],
    notices: rows
      .filter((r) => Number(r.Profit) < 0)
      .map((r) =>
        notice(
          r.id,
          `${r.Customer}: recorded costs exceed revenue; review scope and pricing.`,
          "warning",
        ),
      ),
    columns: [
      "Customer",
      "Revenue",
      "Total cost",
      "Profit",
      "Margin (%)",
      "Revenue / hour",
    ],
    rows,
  };
}
