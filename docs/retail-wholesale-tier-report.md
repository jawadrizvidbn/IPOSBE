# Retail / Wholesale category and combo report

## Scope and status

This enhances only the new `/api/database/retail-wholesale-tier-report` endpoint.
The original Retail/Wholesale and category reports are untouched. Frontend and
backend revisions must be released together: the response now includes combo,
regular, unmatched and reconciliation metrics.

**Do not deploy this revision until the reference sale comparison and monetary reconciliation have been reviewed.** No production deployment is part of this implementation.

## Inputs, sources and access

The endpoint accepts authorized `shopKeys`, `startDate` and inclusive `endDate`.
Validation and the existing authentication middleware remain in place. Dates are
converted to an exclusive next-day bound and every touched monthly table is queried
independently, including year boundaries. Grouping never crosses branches/months.

`reportService.js` still calls `databaseController.getActiveDatabases(user, shopKey)`,
selects the first history database exactly as the original report, and uses
`createSequelizeInstanceCustom` with the existing user's connection settings.
Monthly tables are discovered through INFORMATION_SCHEMA. Missing databases or
months produce warnings; failed queries fail the report, and the history connection
is closed in `finally`. No new credentials, database writes or schema changes are introduced.

## Observed fields and markers

The reference video shows `Category` and `ComboGroup` in the actual `CehqueNum`
field, along with `qty`, `Cardnum`, `majorno`, `sub1no` and `sub2no`.
Existing source uses `salenum`, `stockcode`, `stockdescription`, `datetime` and
`linetotal`. The video's visible section does not establish salenum or linetotal.
The existing category report calls linetotal totalSelling; using it here remains
provisional pending monetary reconciliation with the customer's reference.

Only exact byte values `Category` and `ComboGroup` qualify for the new tiers.
`Combo` remains separately identifiable as an unmatched legacy Retail marker;
it is never merged into ComboGroup. Cardnum is not summed, grouped or required
for marker eligibility. Its numeric appearance in sample lines does not make it
a group identifier.

## Grouping and line allocation

`groupClassification.js` centralizes the optional grouping:

- Checkbox **unchecked** (default): Sale + Major + Sub1, for both ComboGroup and Category.
- Checkbox **checked**: Sale + Major + Sub1 + Sub2, for both markers.

The API accepts `includeSub2=true|false` as a boolean or exact query string;
omitted means false. Other values are rejected before database discovery.
The effective Sub2 key is the same in the aggregate and join, preventing row
multiplication. Markers remain separate in both modes. Product rows are not merged.

The clearer screenshot confirms ComboGroup quantities of 3 in sales 44464.2 and
44472.2 split into 2 and 1 when Sub2 is included. Category quantity 14 in sale
44472.2 splits into 8/5/1. The latest business instruction makes Sub2 selectable
instead of imposing one grouping interpretation.

The derived subquery sums signed `COALESCE(qty,0)` over those keys within the
report dates. Category keys use null-safe joins. Sale IDs use ordinary equality:
missing sale IDs cannot qualify for a grouped tier. Exact marker grouping uses
HEX to avoid accidental merging under case-insensitive database collations.
No DISTINCT line elimination occurs; identical real transaction rows remain rows.

A single unique group joins back to each original product line. That group's sum
selects the classification, but only the original line's qty and linetotal are
allocated to that product. Group values are never repeated against each product.
The query uses derived tables and CASE expressions compatible with MySQL 5.1;
there are no CTEs or window functions.

## Mutually exclusive leaf buckets

| Bucket | Rule |
|---|---|
| Regular Retail | Both marker fields blank after trim/null normalization |
| Combo 3 / 6 / 9 | Exact ComboGroup marker and grouped qty exactly 3 / 6 / 9 |
| Category 10–99 | Exact Category marker and 10 <= grouped qty < 100 |
| Category 100–999 | Exact Category marker and 100 <= grouped qty < 1000 |
| Category 1000+ | Exact Category marker and grouped qty >= 1000 |
| Unmatched Retail | No confirmed tier; original SQL CASE classifies the line as Retail |
| Unmatched Wholesale | No confirmed tier; original SQL CASE classifies the line as Wholesale |

The fallback CASE is the original SQL expression:
`CehqueNum IN ('Combo','ComboGroup','')` => Retail, else Wholesale. Its collation
semantics are preserved on the fallback path. The explicit normalized both-blank
Regular Retail rule precedes fallback, as confirmed by the new requirement.
Whitespace/case variants of nonblank markers are not silently granted new tiers.

Examples of unmatched: ComboGroup qty 4/7/12, Category qty 9, unknown markers,
legacy Combo markers, missing sale IDs and partial blank markers that cannot
qualify. They are visible in separate Qty/Value columns. A warning counts actual
unmatched lines even if refunds cancel their net quantity/value to zero.

## Totals and reconciliation

For both quantities and monetary values:

- Retail Total = Regular Retail + Combo 3 + Combo 6 + Combo 9 + Unmatched Retail.
- Wholesale Total = Category tier 1 + tier 2 + tier 3 + Unmatched Wholesale.
- Total = Retail Total + Wholesale Total.

When unmatched Wholesale is zero, Wholesale Total equals exactly the three
category tiers. Including its separately displayed unmatched component is necessary
to preserve legacy Wholesale money without dropping it or moving it to Retail.
Totals must not be added to their leaf buckets again. Hidden UI columns do not
change any subtotal or total.

The response retains product `data`, `shops`, `branchTotals`, `totals`, `warnings`
and adds the active `grouping`. Product rows remain keyed by stockcode with a
stable lexicographic-max description across monthly/branch results.

## Synthetic sample calculations

- Same sale/category/marker: A qty 20/value 200, B qty 30/value 300, C qty 25/value
  250 => group qty 75; each product's own value enters Category 10–99, total 750.
- Same combo group: A qty 1/value 10 and B qty 2/value 20 => group qty 3; product
  values remain 10 and 20 in Combo 3, total 30, never 30 per product.
- Category qty 9/value 90 => Unmatched Wholesale 90, included once in Wholesale Total.
- ComboGroup qty 4/value 40 => Unmatched Retail 40, included once in Retail Total.

## Validation and release gate

Run `node --test tests/groupClassification.test.js tests/retailWholesaleTier.test.js`.
Tests execute generated SQL in SQLite with equivalent HEX and null-safe equality,
covering tier boundaries, signed refunds, nulls, duplicate rows, separated markers,
sales/Sub2, date bounds, allocation, branch totals and warnings. This is not a live
MySQL 5.1 certification or reconciliation against production records.

See `category-combo-validation.md` and the read-only helper for the remaining actual
sale validation. getGroupFields(includeSub2) describes the selected keys; the API echoes both
includeSub2 and grouping. The UI and exports use returned metadata, never an
unsaved checkbox change.

## Latest audio clarification: normal columns versus validation

The normal UI has Pure Retail, Combo 3/6/9, Category tiers and totals; Unmatched
Retail/Wholesale are no longer normal business columns. The API retains those
internal counters only to disclose unexpected marked groups without losing money.
The response's validationLineCount and warning flag such records, including net-zero
refund cases. The UI shows diagnostic amounts, and exports add explicitly labelled
Validation Retail/Wholesale Qty/Value fields only when anomalies exist. Valid POS
records therefore show the client's requested columns and totals alone.

Sub2 is optional for BOTH marker types. includeSub2 defaults false. A checked UI
control sends true; exact string false remains false. The API echoes includeSub2
and grouping, and exports include the generated grouping in each row and filename.
The user's original choice of separate marker defaults is superseded by this checkbox.
