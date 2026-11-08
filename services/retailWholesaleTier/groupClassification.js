/** MySQL 5.1-compatible grouping and classification shared by the tier report and diagnostics. */

// Both marker types use the user's selected grouping; Sub2 is excluded by default.
const BASE_FIELDS = Object.freeze(["salenum", "majorno", "sub1no"]);
function getGroupFields(includeSub2 = false) {
  return [...BASE_FIELDS, ...(includeSub2 ? ["sub2no"] : [])];
}
const CATEGORY_MARKER = "Category";
const COMBO_MARKER = "ComboGroup";

// Permit only monthly identifiers produced by the existing report date validation.
function validateTable(table) {
  if (!/^\d{6}tbldata_current_tran$/.test(table)) throw new Error("Invalid monthly table name.");
}

// Match confirmed marker bytes exactly without silently merging case variants or Combo with ComboGroup.
function markerEquals(alias, marker) {
  return `HEX(${alias}.CehqueNum) = '${Buffer.from(marker).toString("hex").toUpperCase()}'`;
}

// Use the identical effective Sub2 key in grouping and joins to prevent duplicate matches.
function sub2GroupKey(alias, includeSub2) {
  return includeSub2 ? `${alias}.sub2no` : "NULL";
}

// Aggregate each marker once; the same effective key is used in grouping and joining back to lines.
function buildGroupedLinesQuery(table, includeSub2 = false) {
  validateTable(table);
  const sub2 = sub2GroupKey("m", includeSub2);
  return `SELECT ${BASE_FIELDS.map(field => `m.${field}`).join(", ")},
    ${sub2} AS sub2no,
    HEX(m.CehqueNum) AS markerKey, MIN(m.CehqueNum) AS marker,
    SUM(COALESCE(m.qty, 0)) AS groupQty,
    SUM(COALESCE(m.linetotal, 0)) AS groupValue,
    COUNT(*) AS lineCount,
    SUM(CASE WHEN TRIM(COALESCE(m.Cardnum, '')) = '' THEN 1 ELSE 0 END) AS blankCardLines
    FROM \`${table}\` m
    WHERE m.datetime >= :start AND m.datetime < :endExclusive
    GROUP BY ${BASE_FIELDS.map(field => `m.${field}`).join(", ")}, ${sub2}, HEX(m.CehqueNum)`;
}

// Join each original line to exactly one group; missing sale IDs cannot qualify for a grouped tier.
function buildClassifiedLinesQuery(table, includeSub2 = false) {
  validateTable(table);
  const join = BASE_FIELDS.map(field =>
    field === "salenum" ? "g.salenum = t.salenum" : `g.${field} <=> t.${field}`,
  ).join(" AND ") + ` AND g.sub2no <=> (${sub2GroupKey("t", includeSub2)})`;

  // Every line enters one bucket; unmatched lines use the original report's Retail/Wholesale CASE.
  return `SELECT t.stockcode, t.stockdescription,
    COALESCE(t.qty, 0) AS Quantity, COALESCE(t.linetotal, 0) AS SalesValue,
    CASE
      WHEN ${markerEquals("t", CATEGORY_MARKER)} AND t.salenum IS NOT NULL THEN
        CASE WHEN g.groupQty >= 1000 THEN 'wholesaleTier3'
             WHEN g.groupQty >= 100 THEN 'wholesaleTier2'
             WHEN g.groupQty >= 10 THEN 'wholesaleTier1' ELSE 'unmatchedWholesale' END
      WHEN ${markerEquals("t", COMBO_MARKER)} AND t.salenum IS NOT NULL THEN
        CASE WHEN g.groupQty = 3 THEN 'combo3'
             WHEN g.groupQty = 6 THEN 'combo6'
             WHEN g.groupQty = 9 THEN 'combo9' ELSE 'unmatchedRetail' END
      WHEN TRIM(COALESCE(t.CehqueNum, '')) = '' AND TRIM(COALESCE(t.Cardnum, '')) = '' THEN 'regularRetail'
      WHEN t.CehqueNum IN ('Combo','ComboGroup','') THEN 'unmatchedRetail'
      ELSE 'unmatchedWholesale'
    END AS Bucket
    FROM \`${table}\` t
    LEFT JOIN (${buildGroupedLinesQuery(table, includeSub2)}) g
      ON ${join} AND g.markerKey <=> HEX(t.CehqueNum)
    WHERE t.datetime >= :start AND t.datetime < :endExclusive`;
}

// Compare actual sale groups independently of the active report grouping, including both monetary sums.
function buildGroupingComparisonQuery(table) {
  validateTable(table);
  const grouped = includeSub2 => {
    const fields = [...BASE_FIELDS, ...(includeSub2 ? ["sub2no"] : [])];
    return `SELECT ${fields.join(", ")}, HEX(CehqueNum) AS markerKey,
      MIN(CehqueNum) AS marker, SUM(COALESCE(qty,0)) AS groupQty,
      SUM(COALESCE(linetotal,0)) AS groupValue
      FROM \`${table}\`
      WHERE datetime >= :start AND datetime < :endExclusive AND salenum IN (:sales)
        AND HEX(CehqueNum) IN (HEX('Category'), HEX('ComboGroup'))
      GROUP BY ${fields.join(", ")}, HEX(CehqueNum)`;
  };

  // Label both alternatives without applying either choice to the live report.
  const classification = alias => `CASE WHEN ${alias}.markerKey = HEX('ComboGroup') THEN
    CASE WHEN ${alias}.groupQty = 3 THEN 'Combo 3' WHEN ${alias}.groupQty = 6 THEN 'Combo 6'
         WHEN ${alias}.groupQty = 9 THEN 'Combo 9' ELSE 'Unmatched Retail' END
    ELSE CASE WHEN ${alias}.groupQty >= 1000 THEN 'Category 1000+'
              WHEN ${alias}.groupQty >= 100 THEN 'Category 100-999'
              WHEN ${alias}.groupQty >= 10 THEN 'Category 10-99' ELSE 'Unmatched Wholesale' END END`;

  return `SELECT a.salenum, a.marker, a.majorno, a.sub1no, a.sub2no,
    a.groupQty AS withSub2Qty, b.groupQty AS withoutSub2Qty,
    ${classification("a")} AS withSub2Classification,
    ${classification("b")} AS withoutSub2Classification,
    a.groupValue AS withSub2Value, b.groupValue AS withoutSub2Value
    FROM (${grouped(true)}) a JOIN (${grouped(false)}) b
      ON a.salenum = b.salenum AND a.majorno <=> b.majorno
      AND a.sub1no <=> b.sub1no AND a.markerKey = b.markerKey
    ORDER BY a.salenum, a.marker, a.majorno, a.sub1no, a.sub2no`;
}

module.exports = {
  getGroupFields, CATEGORY_MARKER, COMBO_MARKER,
  buildGroupedLinesQuery, buildClassifiedLinesQuery, buildGroupingComparisonQuery,
};
