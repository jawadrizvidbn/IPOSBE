# Retail / Wholesale Tier Report

## Purpose and isolation

This is a new Across Store report. It does not replace or change the existing
Retail / Wholesale report. Its endpoint is:

`GET /api/database/retail-wholesale-tier-report?shopKeys=Beacon,Bellville&startDate=2026-11-01&endDate=2026-11-30`

The existing Bearer-token middleware authenticates the caller. The new service
then checks every requested store against the current user's `allowedStores`,
including superadmins, matching the existing store selector's access list.
Dates are required, must be real calendar dates, and must be in ascending order.

## Classification, in order

1. A line is marked only if **both** `CehqueNum` and `Cardnum` are nonblank after
   trimming. NULL is treated as blank. Cardnum is a marker, never a quantity.
2. Within each branch and monthly history table, select transactions inside the
   requested date range. Sum `COALESCE(qty, 0)` for marked lines sharing
   `(salenum, majorno, sub1no)`.
3. Assign each marked line a tier using that group's quantity:

   | Group quantity | Classification |
   | --- | --- |
   | Below 10 | Retail |
   | At least 10, below 100 | Wholesale Tier 1 |
   | At least 100, below 1,000 | Wholesale Tier 2 |
   | At least 1,000 | Wholesale Tier 3 |

4. Unmarked lines always remain Retail, even if their sale/category group has
   marked lines in a wholesale tier.
5. Aggregate quantities from `qty` and sales values from `linetotal` by stock code.
   Missing quantities/values contribute zero. No additional tax, payment, transfer,
   discount or cancellation filters are introduced beyond the supplied SQL.

Example: marked products A and B have quantities 6 and 5 on the same sale with
matching categories. Both are Tier 1 (group quantity 11). An unmarked quantity
100 in that same group remains Retail and does not increase the marked group.

The join uses MySQL's null-safe `<=>` comparison for majorno and sub1no. Sale
numbers use ordinary equality, exactly as in the customer's query. Grouping
never crosses monthly tables or branches. Refunds/negative quantities remain
signed and affect group thresholds and totals exactly as the supplied SQL does.
Fractional quantities use exact numeric thresholds, not integer-rounded ranges.

## Dates, database discovery, and aggregation

The UI end date is inclusive. The SQL uses `datetime >= startDate` and
`datetime < dayAfterEndDate`, so the entire last day is included. Month names
are generated separately for each year/month; December–January ranges work.

Database discovery reuses `databaseController.getActiveDatabases(user, shopKey)`
and the first database containing `history`, exactly as the existing Retail /
Wholesale report does. Connection creation reuses `createSequelizeInstanceCustom`
with the same user host, port, username, password, dialect and pool settings.
Stores are fetched with Promise.all, matching the existing report. There is no
separate discovery SQL or custom connection configuration in this report. Monthly tables are checked in INFORMATION_SCHEMA.
Missing databases/months produce explicit warnings and available data is still
returned. Query/connection failures fail the request rather than silently
returning incomplete results. A warning means the report may be incomplete.

Classification happens per month before aggregation. Monthly results are merged
by stock code alone. If descriptions differ, the lexicographically greatest
returned description is used as a stable display label. Null stock codes remain
a distinct group. Branch names remain intact in nested `shops` objects.

`retailQty/Value`, `wholesaleTier1Qty/Value`, `wholesaleTier2Qty/Value`,
`wholesaleTier3Qty/Value` and `totalQty/Value` are returned per product/branch,
with per-product all-store totals, branch totals, and overall totals. Totals
include all classifications even when the UI hides some columns.

## Modules

- `services/retailWholesaleTier/reportLogic.js`: pure validation, monthly SQL,
  and aggregation functions.
- `services/retailWholesaleTier/reportService.js`: existing discovery/connection helper reuse,
  monthly queries, response assembly, and history connection cleanup.
- `controllers/retailWholesaleTierController.js`: HTTP responses/errors.
- `routes/databaseRoutes.js`: one additional authenticated route.

SQL uses derived tables, CASE, GROUP BY and `<=>`; no CTEs/window functions or
new schema are needed. Values use Sequelize replacements. The existing connection factory selects the history database; generated monthly
identifiers are validated.

## Verification and deployment

Run `node --test tests/retailWholesaleTier.test.js` from IPOSBE. The calculation
fixtures execute generated SQL with SQLite's `IS` substituted for MySQL `<=>`.
This checks calculations locally; it does not certify MySQL 5.1 execution or
production performance. Service lifecycle tests stub the existing discovery and connection helpers,
verify credential/port forwarding, and check history connection cleanup.
The shared discovery helper retains its existing connection lifecycle; this
feature does not modify shared helper behavior.

Before rollout, execute on a representative MySQL 5.1 branch with real monthly
tables, compare with the customer's SQL, and inspect query timings/EXPLAIN.
No indexes or schema changes are made automatically. Existing monthly exports
show only the transaction primary key, so large datasets may need DBA-reviewed
indexes after measurement. JavaScript aggregation uses existing project numeric
conventions (Number); it is not arbitrary-precision financial accounting.

Deploy backend support before or together with the frontend. Manually smoke-test
existing Across Store reports, selection, and exports, then the new report's
single/multiple branches, multi-month ranges, missing months, and tier filters.
