import test from "node:test";
import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
test("Documented sample results match independently specified expectations", () => {
  const report = analyze(example.records, example.settings, config.asOf);
  for (const [label, value] of [
    ["Period revenue", "7000.00"],
    ["Period profit", "1500.00"],
    ["Below target", 1],
  ])
    assert.equal(
      report.metrics.find((m) => m.label === label).value,
      value,
      label,
    );
});
test("Business edge cases", () => {
  (function edge(records, s, analyze) {
    assert.equal(
      analyze([{ ...records[0], revenue: 0, hours: 0 }], s).rows[0][
        "Margin (%)"
      ],
      "N/A",
    );
    assert.equal(
      analyze([{ ...records[0], hours: 0 }], s).rows[0]["Revenue / hour"],
      "N/A",
    );
  })(example.records, example.settings, analyze, validateState);
});

test("A rounded percentage cannot hide a margin shortfall", () => {
  const report = analyze(
    [
      {
        ...example.records[0],
        ...{
          revenue: 50,
          hours: 1,
          hourlyCost: 40.001,
          directCosts: 0,
          overhead: 0,
        },
      },
    ],
    { ...example.settings, ...{ targetMargin: 20 } },
    config.asOf,
  );
  assert.equal(report.rows[0]["Margin (%)"], 20);
  assert.equal(report.metrics.find((m) => m.label === "Below target").value, 1);
});
