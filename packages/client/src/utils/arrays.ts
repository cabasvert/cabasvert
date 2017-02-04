declare global {
  interface Array<T> {
    contains(x: T): boolean
    groupBy(f: (x: T) => string): Group<T>[]
  }
}

export class Group<T> {
  constructor(public key: string, public values: T[]) {
  }
}

Array.prototype.contains = function <T>(x: T): boolean {
  return contains(this, x)
}

export function contains<T>(array: T[], elt: T) {
  return array.indexOf(elt) > -1
}

// TODO Investigate why Ionic does not see this method but WebStorm does
Array.prototype.groupBy = function <T>(f: (x: T) => string): Group<T>[] {
  return groupBy(this, f)
}

export function groupBy<T>(as: T[], f: (x: T) => string): Group<T>[] {
  let groups: { [k: string]: T[] } = {}
  as.forEach((o) => {
    let key = f(o)
    if (key in groups) groups[key].push(o)
    else groups[key] = [o]
  })
  return Object
    .keys(groups)
    .map(key => new Group(key, groups[key]))
    .reduce((acc, g) => [...acc, g], [])
}

export function copyWith<T>(source: T[], index: number, value: T): T[] {
  let copy = source.slice()
  copy[index] = value
  return copy
}

export function copyAdd<T>(source: T[], value: T): T[] {
  let copy = source.slice()
  copy.push(value)
  return copy
}

export function copyRemove<T>(source: T[], index: number): T[] {
  return source.slice(0, index).concat(source.slice(index + 1, source.length))
}
