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
  addDays(days: number): Date;

  substract(other: Date): number;

  getWeek(): [number, number];

  setWeek(week: [number, number]): Date;
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.substract = function (other) {
  return Math.round((this.getTime() - other.getTime()) / (1000 * 60 * 60 * 24));
};

Date.prototype.getWeek = function () {
  // Copy date so don't modify original
  var d = new Date(+this);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  // Get first day of year
  var yearStart = new Date(d.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // Return array of year and week number
  return [d.getFullYear(), weekNo];
};

Date.prototype.setWeek = function (week) {
  // Copy date so don't modify original
  var d = new Date(+this);
  // Get first day of year
  var yearStart = new Date(week[0], 0, 1);
  d.setTime(yearStart.getTime() + (week[1] * 7 - 1) * 86400000);
  d.setDate(d.getDate() + this.getDay() - d.getDay());
  return d;
};
