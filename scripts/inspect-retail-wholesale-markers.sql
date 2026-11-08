/* READ ONLY: select one branch HISTORY database before running.
   Replace 202611tbldata_current_tran in every statement for the desired month.
   Run schema inspection FIRST; stop if the referenced columns do not exist.
   Card numbers are never returned; only blank/nonblank counts are exposed.
   This does not enable or change any deployed report calculation. */

-- Verify the physical column names and types before running the remaining queries.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = '202611tbldata_current_tran'
ORDER BY ORDINAL_POSITION;

-- Bound the inspection to one report month using the same exclusive-end convention.
SET @DateFrom = '2026-11-01';
SET @DateToExclusive = '2026-12-01';

-- Observe exact marker identifiers and Cardnum population without exposing card contents.
SELECT MIN(CehqueNum) AS Marker, HEX(CehqueNum) AS MarkerKey,
  COUNT(*) AS LineCount,
  SUM(CASE WHEN TRIM(COALESCE(Cardnum, '')) = '' THEN 1 ELSE 0 END) AS BlankCardLines,
  SUM(CASE WHEN TRIM(COALESCE(Cardnum, '')) <> '' THEN 1 ELSE 0 END) AS PopulatedCardLines,
  SUM(COALESCE(qty, 0)) AS Quantity,
  SUM(COALESCE(linetotal, 0)) AS SalesValue
FROM 202611tbldata_current_tran
WHERE datetime >= @DateFrom AND datetime < @DateToExclusive
GROUP BY HEX(CehqueNum)
ORDER BY LineCount DESC;

-- Show representative distinct sale/category/marker groups, retaining signed sums and all lines.
SELECT salenum, majorno, sub1no, sub2no,
  MIN(CehqueNum) AS Marker, HEX(CehqueNum) AS MarkerKey,
  COUNT(*) AS LineCount, COUNT(DISTINCT stockcode) AS ProductCount,
  SUM(COALESCE(qty, 0)) AS GroupQty,
  SUM(COALESCE(linetotal, 0)) AS GroupValue,
  SUM(CASE WHEN TRIM(COALESCE(Cardnum, '')) = '' THEN 1 ELSE 0 END) AS BlankCardLines
FROM 202611tbldata_current_tran
WHERE datetime >= @DateFrom AND datetime < @DateToExclusive
GROUP BY salenum, majorno, sub1no, sub2no, HEX(CehqueNum)
ORDER BY LineCount DESC, salenum
LIMIT 50;
