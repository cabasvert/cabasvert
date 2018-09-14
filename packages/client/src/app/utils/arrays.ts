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

declare global {
  interface Array<T> {
    contains(x: T): boolean;

    indexed(f: (t: T) => string): { [key: string]: T };

    indexedAsMap(f: (t: T) => string): Map<string, T>;

    groupBy(f: (x: T) => string): Group<T>[];
  }
}

export class Group<T> {
  constructor(public key: string, public values: T[]) {
  }
}

Array.prototype.contains = function <T>(x: T): boolean {
  return contains(this, x);
};

export function contains<T>(array: T[], elt: T) {
  return array.indexOf(elt) > -1;
}

Array.prototype.indexed = function <T>(f: (t: T) => string): { [key: string]: T } {
  return arrayIndexed(this, f);
};

export function arrayIndexed<T>(array: T[], f: (t: T) => string): { [key: string]: T } {
  return array.reduce(
    (acc, elt) => {
      acc[f(elt)] = elt;
      return acc;
    },
    {},
  );
}

Array.prototype.indexedAsMap = function <T>(f: (t: T) => string): Map<string, T> {
  return arrayIndexedAsMap(this, f);
};

export function arrayIndexedAsMap<T>(array: T[], f: (t: T) => string): Map<string, T> {
  return array.reduce(
    (acc, elt) => {
      acc.set(f(elt), elt);
      return acc;
    },
    new Map(),
  );
}

// TODO Investigate why Ionic does not see this method but WebStorm does
Array.prototype.groupBy = function <T>(f: (x: T) => string): Group<T>[] {
  return groupBy(this, f);
};

export function groupBy<T>(as: T[], f: (x: T) => string): Group<T>[] {
  let groups: { [k: string]: T[] } = {};
  as.forEach((o) => {
    let key = f(o);
    if (key in groups) groups[key].push(o);
    else groups[key] = [o];
  });
  return Object
    .keys(groups)
    .map(key => new Group(key, groups[key]))
    .reduce((acc, g) => [...acc, g], []);
}

export function copyWith<T>(source: T[], index: number, value: T): T[] {
  let copy = source.slice();
  copy[index] = value;
  return copy;
}

export function copyAdd<T>(source: T[], value: T): T[] {
  let copy = source.slice();
  copy.push(value);
  return copy;
}

export function copyRemove<T>(source: T[], index: number): T[] {
  return source.slice(0, index).concat(source.slice(index + 1, source.length));
}
