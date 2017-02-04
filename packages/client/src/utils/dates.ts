interface Date {
  addDays(days: number): Date;
  substract(other: Date): number;
  getWeek(): [ number, number ];
  setWeek(week: [ number, number ]): Date;
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf())
  date.setDate(date.getDate() + days)
  return date
}

Date.prototype.substract = function (other) {
  return Math.round((this.getTime() - other.getTime()) / (1000 * 60 * 60 * 24))
}

Date.prototype.getWeek = function () {
  // Copy date so don't modify original
  var d = new Date(+this)
  d.setHours(0, 0, 0, 0)
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  // Get first day of year
  var yearStart = new Date(d.getFullYear(), 0, 1)
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  // Return array of year and week number
  return [ d.getFullYear(), weekNo ]
}

Date.prototype.setWeek = function (week) {
  // Copy date so don't modify original
  var d = new Date(+this)
  // Get first day of year
  var yearStart = new Date(week[ 0 ], 0, 1)
  d.setTime(yearStart.getTime() + (week[ 1 ] * 7 - 1) * 86400000)
  d.setDate(d.getDate() + this.getDay() - d.getDay())
  return d
}
