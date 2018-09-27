/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

interface Date {

  /**
   * Returns the ISO day. (0 = monday, 6 = sunday)
   */
  getISODay(): number;

  /**
   * Sets the day to a day of the week.
   * @param day the day of the week (0 = monday, 6 = sunday)
   */
  setISODay(day: number): Date;

  addDays(days: number): Date;

  subtract(other: Date): number;

  getISOWeek(): [number, number];

  isBefore(other: Date): boolean;
}

// noinspection JSUnusedGlobalSymbols
interface DateConstructor {

  today(): Date;

  fromISOWeek(week: [number, number]): Date;
}

const MILLISECONDS_IN_A_MINUTE = 1000 * 60;
const MILLISECONDS_IN_A_DAY = MILLISECONDS_IN_A_MINUTE * 60 * 24;

Date.prototype.getISODay = function () {
  return (this.getDay() || 7) - 1;
};

Date.prototype.setISODay = function (day) {
  return this.addDays(-this.getISODay() + day);
};

Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.subtract = function (other) {
  return Math.round((this.getTime() - other.getTime()) / MILLISECONDS_IN_A_DAY);
};

Date.prototype.getISOWeek = function () {
  // Copy date so don't modify original
  let d = new Date(+this);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  // Get first day of year
  let yearStart = new Date(d.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  let weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / MILLISECONDS_IN_A_DAY) + 1) / 7);
  // Return array of year and week number
  return [d.getFullYear(), weekNo];
};

Date.prototype.isBefore = function (other) {
  return this.toISOString() < other.toISOString();
};

Date.today = function () {
  let date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

Date.fromISOWeek = function (week) {
  let year = week[0];
  let weekNumber = week[1];

  let simple = new Date(year, 0, 1).addDays((weekNumber - 1) * 7);
  let isoDay = simple.getISODay();
  if (isoDay <= 3)
    return simple.addDays(-isoDay);
  else
    return simple.addDays(-isoDay + 7);
};
