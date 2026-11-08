# Reference sale grouping comparison — not deployed

## Evidence and limits

The clearer screenshot supplied on 2026-11-08 shows salenum and transaction lines
from November's Beacon history table. Sale 44464.2 is now identified, as is 44472.2.
The quantities and keys below are transcribed from visible actual records, not
invented sale IDs. This corrects the earlier video-frame reading: sale 44464.2's
Sub2 values are 3, 1, 3 (not 3, 1, 0). The screenshot does not show linetotal.

Direct shop SQL still cannot be queried from this Mac (ETIMEDOUT in the previous
read-only validation attempt). Screenshot observations have not been independently
reconciled against a complete source extract; do not claim exact monetary results.

## Visible product/group records

| Sale | Marker | Transaction | Product description | Major | Sub1 | Sub2 | Qty |
|---|---|---|---|---|---|---|---|
| 44464.2 | ComboGroup | 1 | SWEET CANDLE 80ml | 1 | 3 | 3 | 1 |
| 44464.2 | ComboGroup | 2 | WHITE OUD 80ml | 1 | 3 | 1 | 1 |
| 44464.2 | ComboGroup | 3 | ON MY WAY 80ml | 1 | 3 | 3 | 1 |
| 44472.2 | ComboGroup | 1 | ARYA 80ml | 1 | 3 | 3 | 1 |
| 44472.2 | ComboGroup | 2 | BERRY & BERRY 80ml | 1 | 3 | 3 | 1 |
| 44472.2 | ComboGroup | 3 | CLUB DE ABSOLU 80ml | 1 | 3 | 2 | 1 |
| 44472.2 | Category | 4 | ARYA 40ml | 1 | 4 | 3 | 3 |
| 44472.2 | Category | 5 | BLACK OUD 40ml | 1 | 4 | 1 | 3 |
| 44472.2 | Category | 6 | FLAWLESS 40ml | 1 | 4 | 3 | 1 |
| 44472.2 | Category | 7 | OUD D GREAT 40ml | 1 | 4 | 1 | 1 |
| 44472.2 | Category | 8 | GORGEOUS GIRL 40ml | 1 | 4 | 3 | 1 |
| 44472.2 | Category | 9 | S-CANDLE 40ml | 1 | 4 | 3 | 1 |
| 44472.2 | Category | 10 | DEZIRE BLUE 40ml | 1 | 4 | 2 | 1 |
| 44472.2 | Category | 11 | WICKED FEMME 40ml | 1 | 4 | 3 | 1 |
| 44472.2 | Category | 12 | WHITE OUD CLASSIC | 1 | 4 | 1 | 1 |
| 44472.2 | Category | 13 | DARK SECRET 40ml | 1 | 4 | 3 | 1 |

No Category lines are visible for sale 44464.2. This does not prove the complete
source contains none; the read-only comparison will return all matching records.

## Grouping and classification comparison

Each quantity list is matched to the Sub2 list in the same order.

| Sale | Marker | Major/Sub1 | Sub2 values | Qty with Sub2 | Qty without Sub2 | Classification with => without Sub2 |
|---|---|---|---|---|---|---|
| 44464.2 | ComboGroup | 1/3 | 1, 3 | 1, 2 | 3 | Unmatched Retail => Combo 3 |
| 44472.2 | ComboGroup | 1/3 | 2, 3 | 1, 2 | 3 | Unmatched Retail => Combo 3 |
| 44472.2 | Category | 1/4 | 1, 2, 3 | 5, 1, 8 | 14 | Unmatched Wholesale => Category 10–99 |

Category Sub2 3 = 3+1+1+1+1+1 = 8. Sub2 1 = 3+1+1 = 5. Sub2 2 = 1.

## Monetary impact

Let C64 and C72 be each sale's sum of ComboGroup linetotal, and W72 be sale
44472.2's sum of Category linetotal. Exact amounts cannot be read in this screenshot.

- Removing Sub2 for Combo moves C64 and C72 from Unmatched Retail to Combo 3.
  Retail Total and overall Total do not change. Each product keeps its own value.
- Removing Sub2 for Category would move W72 from Unmatched Wholesale to Category
  10–99. Wholesale Total and overall Total would not change.
- Under the selected checkbox mode, W72 enters Category 10–99 without Sub2, or
  remains under the unmatched validation classification when Sub2 is included.
- Do not substitute stockunitprice * qty or valuediscount for linetotal; discount,
  tax, rounding and final monetary treatment have not been reconciled.

## Implemented decision and regression checks

The latest business instruction makes Sub2 optional for both markers through one
**Include Sub2 in grouping** checkbox. Default is unchecked (Sale/Major/Sub1).
Checked includes Sub2. Each report requires explicit regeneration after a control
change; its returned metadata and export filename record the mode actually used.

The earlier marker-specific default (Combo without Sub2, Category with Sub2) is
superseded by this selectable rule. Both modes preserve each original product's
own quantity/value once and retain the same overall Retail/Wholesale totals.

Tests transcribe the screenshot sale IDs, keys and quantities. Test linetotal
amounts are synthetic and explicitly labelled, not production monetary evidence.
Executed SQL verifies both grouping alternatives, current classifications, product
allocation and reconciliation without duplicate line/group value multiplication.

## Read-only verification on an accessible machine

From the backend folder, with an existing application user authorized for Beacon:

```
node scripts/validate-combo-sub2.js <application-user-id> 202611tbldata_current_tran 44464.2 44472.2
```

The helper reads existing connection settings from the application DB, checks schema
columns, and returns all Category/ComboGroup product lines for the explicit sales,
plus both groupings, both classifications, and actual linetotal sums. Cardnum
contents and credentials are not printed. No application model sync, writes or
schema changes are performed. Use privately; source transaction data must not be
committed publicly. Additional sale IDs can be supplied, such as 44461.2.

The comparison result repeats each no-Sub2 group total beside its Sub2 groups.
Never sum those repeated withoutSub2Value cells. Sum original lines once, or count
each sale/marker/Major/Sub1 aggregate once.

## Remaining release checks

Review the actual linetotal comparison, verify that the screenshot shows all
eligible source lines for the two sales, and compare both checkbox modes on the complete source records. The user can
now select Sub2 explicitly for either interpretation. No production
deployment or push has been performed for this revision.
