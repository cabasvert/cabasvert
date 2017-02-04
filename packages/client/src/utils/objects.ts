
import { isNullOrUndefined } from "util"
export function objectAssignNoNulls<T, U>(target: T, source: U): T & U
export function objectAssignNoNulls<T, U, V>(target: T, source1: U, source2: V): T & U & V
export function objectAssignNoNulls<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W
export function objectAssignNoNulls(target: any, ...sources: any[]): any {
  for (var source of sources) {
    for (var key in source) {
      let value = source[key]
      if (!isNullOrUndefined(value)) target[key] = value
      else delete target[key]
    }
  }
  return target
}
