/** Pure request/query helpers. No database access or startup side effects. */
const METRICS = [
  "retail",
  "wholesaleTier1",
  "wholesaleTier2",
  "wholesaleTier3",
  "total",
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

/** Each monthly query classifies BEFORE aggregation; never group across branches/months. */
function buildMonthlyQuery(table) {
  // Permit only generated monthly transaction table names as SQL identifiers.
  if (!/^\d{6}tbldata_current_tran$/.test(table))
    throw invalid("Invalid monthly table name.");
  // A line is marked only when both marker fields contain nonblank text.
  const marked = (alias) =>
    `TRIM(COALESCE(${alias}.CehqueNum, '')) <> '' AND TRIM(COALESCE(${alias}.Cardnum, '')) <> ''`;
  // Build a quantity/value pair for each tier and the combined total.
  const aggregates = METRICS.flatMap((metric, tier) => {
    const condition = metric === "total" ? "1 = 1" : `x.Tier = ${tier}`;
    return [
      `SUM(CASE WHEN ${condition} THEN x.Quantity ELSE 0 END) AS ${metric}Qty`,
      `SUM(CASE WHEN ${condition} THEN x.SalesValue ELSE 0 END) AS ${metric}Value`,
    ];
  });
  // Join marked sale/category totals, classify each line, then aggregate by product.
  return `SELECT x.stockcode, MAX(x.stockdescription) AS stockdescription, ${aggregates.join(
    ",\n",
  )}
    FROM (
      SELECT t.stockcode, t.stockdescription, COALESCE(t.qty, 0) AS Quantity,
        COALESCE(t.linetotal, 0) AS SalesValue,
        CASE WHEN ${marked("t")} THEN
          CASE WHEN COALESCE(g.GroupQty, 0) >= 1000 THEN 3
               WHEN COALESCE(g.GroupQty, 0) >= 100 THEN 2
               WHEN COALESCE(g.GroupQty, 0) >= 10 THEN 1 ELSE 0 END
          ELSE 0 END AS Tier
      FROM \`${table}\` t
      LEFT JOIN (
        SELECT salenum, majorno, sub1no, SUM(COALESCE(qty, 0)) AS GroupQty
        FROM \`${table}\` m
        WHERE datetime >= :start AND datetime < :endExclusive AND ${marked("m")}
        GROUP BY salenum, majorno, sub1no
      ) g ON g.salenum = t.salenum AND g.majorno <=> t.majorno AND g.sub1no <=> t.sub1no
      WHERE t.datetime >= :start AND t.datetime < :endExclusive
    ) x GROUP BY x.stockcode ORDER BY x.stockcode`;
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
