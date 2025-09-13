const moment = require("moment");

exports.formatDateForTblTran = (date) => {
  if (!date) return ""; // Return empty string if no date is selected

  return moment(date).format(`YYYYMM`) + "tbldata_current_tran";
};

exports.getStartDateEndDate = (duration, isForTblTran = false) => {
  let startDate;
  let endDate;

  switch (duration) {
    case "weekly":
      startDate = moment().startOf("week");
      endDate = moment();
      break;
    case "monthly":
      startDate = moment().startOf("month");
      endDate = moment();
      break;
    case "yearly":
      startDate = moment().startOf("year");
      endDate = moment();
      break;
    default:
      startDate = moment().startOf("week");
      endDate = moment();
      break;
  }

  return {
    startDate: isForTblTran ? this.formatDateForTblTran(startDate.toDate()) : startDate.toDate(),
    endDate: isForTblTran ? this.formatDateForTblTran(endDate.toDate()) : endDate.toDate(),
  };
};
