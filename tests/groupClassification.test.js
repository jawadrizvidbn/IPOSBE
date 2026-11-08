const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { buildMonthlyQuery, aggregateResults } = require("../services/retailWholesaleTier/reportLogic");
const { getGroupFields, buildGroupedLinesQuery, buildGroupingComparisonQuery } = require("../services/retailWholesaleTier/groupClassification");

// Execute generated MySQL-style SQL against local SQLite arithmetic fixtures, never a production database.
function execute(sql, lines) {
  const script = `
import json, sqlite3, sys
request=json.load(sys.stdin)
db=sqlite3.connect(':memory:')
db.row_factory=sqlite3.Row
db.create_function('HEX',1,lambda x: None if x is None else str(x).encode().hex().upper())
db.execute('CREATE TABLE "202611tbldata_current_tran" (stockcode TEXT, stockdescription TEXT, salenum INT, majorno INT, sub1no INT, sub2no INT, CehqueNum TEXT, Cardnum TEXT, qty REAL, linetotal REAL, datetime TEXT)')
for row in request['lines']:
 db.execute('INSERT INTO "202611tbldata_current_tran" VALUES (?,?,?,?,?,?,?,?,?,?,?)', [row.get(k) for k in ['stockcode','stockdescription','salenum','majorno','sub1no','sub2no','CehqueNum','Cardnum','qty','linetotal','datetime']])
print(json.dumps([dict(r) for r in db.execute(request['sql'],{'start':'2026-11-01','endExclusive':'2026-12-01','sale1':44464.2,'sale2':44472.2})]))
`;
  const result = spawnSync("python3", ["-c", script], {
    input: JSON.stringify({ sql: sql.replaceAll("<=>", "IS"), lines }), encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

// Use unique sale IDs by default so independent fixtures never accidentally contribute to another group.
let nextSale = 1;
function line(stockcode, qty, marker, extra = {}) {
  return { stockcode, stockdescription: stockcode, qty, linetotal: qty == null ? null : qty * 10,
    CehqueNum: marker, Cardnum: null, salenum: nextSale++, majorno: 1, sub1no: 1, sub2no: 1,
    datetime: "2026-11-15 12:00:00", ...extra };
}

// Check category boundaries, exact combos, legacy fallbacks and lossless monetary allocation together.
test("classifies grouped product lines and reconciles every leaf, subtotal and branch", () => {
  const lines = [];
  for (const qty of [9, 10, 99, 100, 999, 1000]) lines.push(line(`category-${qty}`, qty, "Category"));
  for (const qty of [3, 6, 9, 4, 7, 12, -3]) lines.push(line(`combo-${qty}`, qty, "ComboGroup"));
  const sale = nextSale++;
  lines.push(line("combined-a", 1, "ComboGroup", { salenum: sale, Cardnum: "" }));
  lines.push(line("combined-b", 2, "ComboGroup", { salenum: sale, Cardnum: "2" }));
  const categorySale = nextSale++;
  for (const [index, qty] of [20, 30, 25].entries()) {
    lines.push(line(`category-shared-${index}`, qty, "Category", { salenum: categorySale }));
  }
  lines.push(line("legacy-combo", 3, "Combo"));
  lines.push(line("regular", 2, "", { Cardnum: " " }));
  lines.push(line("null-regular", null, null));
  lines.push(line("card-only", 3, "", { Cardnum: "3" }));
  lines.push(line("unknown", 1000, "Unknown"));
  lines.push(line("missing-sale", 3, "ComboGroup", { salenum: null }));
  lines.push(line("missing-sale-category", 10, "Category", { salenum: null }));
  lines.push(line("outside", 1000, "Category", { datetime: "2026-12-01 00:00:00" }));
  lines.push(line("last-second", 1, "", { datetime: "2026-11-30 23:59:59" }));
  const rows = execute(buildMonthlyQuery("202611tbldata_current_tran"), lines);
  const byCode = Object.fromEntries(rows.map(row => [row.stockcode, row]));
  for (const [qty, bucket] of [[9, "unmatchedWholesale"], [10, "wholesaleTier1"], [99, "wholesaleTier1"], [100, "wholesaleTier2"], [999, "wholesaleTier2"], [1000, "wholesaleTier3"]]) {
    assert.equal(byCode[`category-${qty}`][`${bucket}Qty`], qty);
  }
  for (const qty of [3, 6, 9]) assert.equal(byCode[`combo-${qty}`][`combo${qty}Qty`], qty);
  for (const qty of [4, 7, 12, -3]) assert.equal(byCode[`combo-${qty}`].unmatchedRetailQty, qty);
  assert.equal(byCode["combined-a"].combo3Value, 10);
  assert.equal(byCode["combined-b"].combo3Value, 20);
  assert.equal(byCode["category-shared-0"].wholesaleTier1Value, 200);
  assert.equal(byCode["category-shared-1"].wholesaleTier1Value, 300);
  assert.equal(byCode["category-shared-2"].wholesaleTier1Value, 250);
  assert.equal(byCode["legacy-combo"].unmatchedRetailQty, 3);
  assert.equal(byCode.regular.regularRetailQty, 2);
  assert.equal(byCode["null-regular"].regularRetailValue, 0);
  assert.equal(byCode["card-only"].unmatchedRetailQty, 3);
  assert.equal(byCode.unknown.unmatchedWholesaleQty, 1000);
  assert.equal(byCode["missing-sale"].unmatchedRetailQty, 3);
  assert.equal(byCode["missing-sale-category"].unmatchedWholesaleQty, 10);
  assert.equal(byCode.outside, undefined);
  assert.equal(byCode["last-second"].totalQty, 1);

  // Assert signed refunds and unmatched amounts remain in their own subtotal exactly once.
  for (const row of rows) {
    for (const unit of ["Qty", "Value"]) {
      assert.equal(row[`retail${unit}`], ["regularRetail", "combo3", "combo6", "combo9", "unmatchedRetail"].reduce((sum, k) => sum + row[k + unit], 0));
      assert.equal(row[`wholesale${unit}`], ["wholesaleTier1", "wholesaleTier2", "wholesaleTier3", "unmatchedWholesale"].reduce((sum, k) => sum + row[k + unit], 0));
      assert.equal(row[`total${unit}`], row[`retail${unit}`] + row[`wholesale${unit}`]);
    }
  }
  assert.equal(rows.reduce((sum, row) => sum + row.totalValue, 0), lines.filter(row => row.stockcode !== "outside").reduce((sum, row) => sum + (row.linetotal || 0), 0));
  const merged = aggregateResults([{ shopKey: "A", rows }, { shopKey: "B", rows }]);
  assert.equal(merged.totals.totalValue, merged.branchTotals.A.totalValue * 2);
  assert.equal(merged.totals.totalValue, merged.totals.retailValue + merged.totals.wholesaleValue);
});

// Quantities, sale IDs and category keys below are transcribed from the clearer screenshot.
// Values are synthetic because the screenshot does not show linetotal.
test("checkbox changes both marker groupings without changing product/store totals", () => {
  assert.deepEqual(getGroupFields(false), ["salenum", "majorno", "sub1no"]);
  assert.deepEqual(getGroupFields(true), ["salenum", "majorno", "sub1no", "sub2no"]);
  const lines = [];
  for (const [salenum, sub2s] of [[44464.2, [3, 1, 3]], [44472.2, [3, 3, 2]]]) {
    sub2s.forEach((sub2no, i) => lines.push(line(`${salenum}-combo-${i}`, 1, "ComboGroup", {
      salenum, majorno: 1, sub1no: 3, sub2no,
    })));
  }
  // Sale 44472.2: Sub2 3 => 8, Sub2 1 => 5, Sub2 2 => 1; overall Category quantity 14.
  for (const [index, [sub2no, qty]] of [[3, 3], [1, 3], [3, 1], [1, 1], [3, 1], [3, 1], [2, 1], [3, 1], [1, 1], [3, 1]].entries()) {
    lines.push(line(`category-reference-${index}`, qty, "Category", { salenum: 44472.2, majorno: 1, sub1no: 4, sub2no }));
  }
  const rows = execute(buildMonthlyQuery("202611tbldata_current_tran"), lines);
  const combos = rows.filter(row => row.stockcode.includes("combo"));
  assert.equal(combos.length, 6);
  assert.ok(combos.every(row => row.combo3Qty === 1 && row.unmatchedRetailQty === 0));
  assert.equal(combos.reduce((sum, row) => sum + row.combo3Value, 0), 60);
  const categories = rows.filter(row => row.stockcode.startsWith("category-reference"));
  assert.equal(categories.reduce((sum, row) => sum + row.wholesaleTier1Qty, 0), 14);
  const withSub2 = execute(buildMonthlyQuery("202611tbldata_current_tran", true), lines);
  assert.ok(withSub2.filter(row => row.stockcode.includes("combo")).every(row => row.unmatchedRetailQty === 1));
  assert.equal(withSub2.reduce((sum, row) => sum + row.unmatchedWholesaleQty, 0), 14);
  for (const before of rows) {
    const after = withSub2.find(row => row.stockcode === before.stockcode);
    assert.equal(after.totalValue, before.totalValue);
    assert.equal(after.totalQty, before.totalQty);
    assert.equal(after.retailValue, before.retailValue);
    assert.equal(after.wholesaleValue, before.wholesaleValue);
  }

  // Execute the comparison SQL and verify both alternatives from the same source records.
  const comparison = execute(buildGroupingComparisonQuery("202611tbldata_current_tran").replaceAll(":sales", ":sale1,:sale2"), lines);
  const comboComparisons = comparison.filter(row => row.marker === "ComboGroup");
  assert.equal(comboComparisons.length, 4);
  assert.ok(comboComparisons.every(row => row.withoutSub2Qty === 3 && row.withoutSub2Classification === "Combo 3"));
  assert.ok(comboComparisons.every(row => row.withSub2Classification === "Unmatched Retail"));
  const categoryComparisons = comparison.filter(row => row.marker === "Category");
  assert.deepEqual(categoryComparisons.map(row => row.withSub2Qty), [5, 1, 8]);
  assert.ok(categoryComparisons.every(row => row.withoutSub2Qty === 14 && row.withoutSub2Classification === "Category 10-99"));
  assert.equal(categoryComparisons.reduce((sum, row) => sum + row.withSub2Value, 0), 140);
  assert.ok(categoryComparisons.every(row => row.withoutSub2Value === 140));
});

// Confirm null category matching, marker separation, duplicates and category refunds cannot multiply joins.
test("separates markers and sales and preserves nullable categories and duplicate input lines", () => {
  const sale = nextSale++;
  const common = { salenum: sale, majorno: null, sub1no: null, sub2no: null };
  const duplicate = line("duplicate", 5, "Category", common);
  const lines = [duplicate, duplicate, line("refund", -1, "Category", common),
    line("other-sale", 1, "Category"), line("different-marker", 3, "ComboGroup", common),
    line("different-case", 1000, "category", common)];
  const rows = execute(buildMonthlyQuery("202611tbldata_current_tran"), lines);
  const byCode = Object.fromEntries(rows.map(row => [row.stockcode, row]));
  assert.equal(byCode.duplicate.unmatchedWholesaleQty, 10); // Signed group sum is 9 after refund.
  assert.equal(byCode.refund.unmatchedWholesaleQty, -1);
  assert.equal(byCode["other-sale"].unmatchedWholesaleQty, 1);
  assert.equal(byCode["different-marker"].combo3Qty, 3);
  assert.equal(byCode["different-case"].unmatchedWholesaleQty, 1000);
  assert.equal(rows.reduce((sum, row) => sum + row.totalQty, 0), 1013);
  assert.throws(() => buildMonthlyQuery("unsafe; SELECT 1"), /Invalid/);
});
