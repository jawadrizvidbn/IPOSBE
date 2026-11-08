/** Pure request/query helpers. No database access or startup side effects. */
const { buildClassifiedLinesQuery } = require("./groupClassification");

// Leaf buckets are disjoint; Retail, Wholesale and Total are reconciliation subtotals.
const METRICS = [
  "regularRetail", "combo3", "combo6", "combo9", "unmatchedRetail", "retail",
  "wholesaleTier1", "wholesaleTier2", "wholesaleTier3", "unmatchedWholesale", "wholesale", "total",
];

// Attach the intended HTTP status to a validation error.
function invalid(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Accept only real calendar dates in the API date format.
function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw invalid("Start and end dates must use YYYY-MM-DD.");
  }
  // Reject impossible dates that JavaScript would otherwise normalize.
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw invalid("Invalid calendar date.");
  }
  return date;
}

// Validate inputs and derive the authorized stores and monthly tables.
function parseRequest(query, user) {
  // Validate the inclusive date range before discovering any databases.
  const start = parseDate(query.startDate);
  const end = parseDate(query.endDate);
  if (start > end) throw invalid("Start date must be on or before end date.");

  // Parse the checkbox strictly: the string "false" must never enable Sub2.
  const rawSub2 = query.includeSub2;
  if (rawSub2 !== undefined && ![true, false, "true", "false"].includes(rawSub2)) {
    throw invalid("includeSub2 must be true or false.");
  }
  const includeSub2 = rawSub2 === true || rawSub2 === "true";

  // Normalize and deduplicate store names supplied in the URL.
  const requested = [
    ...new Set(
      String(query.shopKeys || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!requested.length) throw invalid("Select at least one store.");

  // Canonical names prevent duplicate branch totals from differently cased URL inputs.
  // Match the same allowedStores list used by the existing store selector.
  const allowed = new Map(
    (Array.isArray(user.allowedStores) ? user.allowedStores : []).map((s) => [
      s.toLowerCase(),
      s,
    ]),
  );
  // Reject the entire request if any selected store is unauthorized.
  if (requested.some((shop) => !allowed.has(shop))) {
    throw invalid(
      "You do not have access to one or more selected stores.",
      403,
    );
  }
  const shops = requested.map((shop) => allowed.get(shop));

  // Enumerate every year/month touched by the range, including year changes.
  const months = [];
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  while (cursor <= end) {
    months.push(
      `${cursor.getUTCFullYear()}${String(cursor.getUTCMonth() + 1).padStart(
        2,
        "0",
      )}tbldata_current_tran`,
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  // Convert the inclusive end date into an exclusive next-day SQL bound.
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    shops,
    months,
    includeSub2,
    start: query.startDate,
    endExclusive: end.toISOString().slice(0, 10),
  };
}

// Initialize all classification and total quantity/value counters to zero.
function emptyMetrics() {
  return Object.fromEntries(
    METRICS.flatMap((metric) => [
      [`${metric}Qty`, 0],
      [`${metric}Value`, 0],
    ]),
  );
}

/** Classify original product lines using sale/category group sums, then pivot their own values. */
function buildMonthlyQuery(table, includeSub2 = false) {
  // Build disjoint leaf conditions and inclusive subtotals from the same classified lines.
  const conditions = Object.fromEntries(METRICS.map(metric => [metric, `x.Bucket = '${metric}'`]));
  conditions.retail = "x.Bucket IN ('regularRetail','combo3','combo6','combo9','unmatchedRetail')";
  conditions.wholesale = "x.Bucket IN ('wholesaleTier1','wholesaleTier2','wholesaleTier3','unmatchedWholesale')";
  conditions.total = "1 = 1";
  const aggregates = METRICS.flatMap(metric => [
    `SUM(CASE WHEN ${conditions[metric]} THEN x.Quantity ELSE 0 END) AS ${metric}Qty`,
    `SUM(CASE WHEN ${conditions[metric]} THEN x.SalesValue ELSE 0 END) AS ${metric}Value`,
  ]);

  // Count unmatched lines separately so cancelling refunds do not hide a validation warning.
  return `SELECT x.stockcode, MAX(x.stockdescription) AS stockdescription,
    ${aggregates.join(",\n")},
    SUM(CASE WHEN x.Bucket IN ('unmatchedRetail','unmatchedWholesale') THEN 1 ELSE 0 END) AS unmatchedLineCount
    FROM (${buildClassifiedLinesQuery(table, includeSub2)}) x
    GROUP BY x.stockcode ORDER BY x.stockcode`;
}

// Accumulate signed quantities and values without dropping numeric zeroes.
function addMetrics(target, source) {
  for (const key of Object.keys(emptyMetrics()))
    target[key] += Number(source[key]) || 0;
}

/** Pivot by stock code alone, retaining exact branch names (no sanitized-key collisions). */
function aggregateResults(branches) {
  const products = new Map();
  const branchTotals = Object.create(null);
  const totals = emptyMetrics();
  // Keep branch counters separate while merging monthly rows by stock code.
  for (const { shopKey, rows } of branches) {
    branchTotals[shopKey] = emptyMetrics();
    for (const row of rows) {
      const key = row.stockcode;
      // Create a product only once, even when it occurs in several branches/months.
      if (!products.has(key))
        products.set(key, {
          stockcode: key,
          stockdescription: "",
          shops: Object.create(null),
          totals: emptyMetrics(),
        });
      // Choose a stable description and initialize this product’s branch counters.
      const product = products.get(key);
      if (String(row.stockdescription || "") > product.stockdescription)
        product.stockdescription = row.stockdescription;
      if (!Object.hasOwn(product.shops, shopKey))
        product.shops[shopKey] = emptyMetrics();
      // Update product, branch and all-store totals from the same source row.
      addMetrics(product.shops[shopKey], row);
      addMetrics(product.totals, row);
      addMetrics(branchTotals[shopKey], row);
      addMetrics(totals, row);
    }
  }
  // Return sorted products alongside branch and overall reconciliation totals.
  return {
    data: [...products.values()].sort((a, b) =>
      String(a.stockcode ?? "").localeCompare(String(b.stockcode ?? "")),
    ),
    branchTotals,
    totals,
  };
}

module.exports = {
  METRICS,
  invalid,
  parseRequest,
  emptyMetrics,
  buildMonthlyQuery,
  aggregateResults,
};
