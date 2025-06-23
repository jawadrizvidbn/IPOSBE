import moment from "moment";

export function getYearAndMonthRange(startDate, endDate) {
  const start = moment(startDate, "YYYY-MM-DD");
  const end = moment(endDate, "YYYY-MM-DD");

  if (!start.isValid() || !end.isValid()) {
    console.log("Please provide valid dates in YYYY-MM-DD format.");
    return { year: null, months: [] };
  }

  const months = [];
  const year = start.year();

  let current = start.clone().startOf("month");
  while (current.isSameOrBefore(end, "month")) {
    months.push(current.format("MM")); // just the two-digit month
    current.add(1, "month");
  }

  return { year, months };
}
