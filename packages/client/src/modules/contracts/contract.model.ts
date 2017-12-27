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

export type Contract = {
  _id: string
  type: string
  srev: string
  season: string
  member: string
  sections: ContractSection[]
  wish?: boolean
  validation?: ContractValidation
  amendments?: ContractAmendment[]
  postponements?: ContractPostponement[]
}

export type ContractSection = {
  kind: string
  formula: number | [number, number]
  firstWeek: number
  lastWeek?: number
}

export type ContractAmendment = {
  week: number
  deltas: ContractSectionCounts
}

export type ContractPostponement = {
  week: number
  deltas: ContractSectionCounts
  rescheduledWeek: number
}

export type ContractSectionCounts = {
  [kind: string]: {
    kind: string
    count: number
  }
}

export class ContractKind {
  public static readonly VEGETABLES = 'legumes'
  public static readonly EGGS = 'oeufs'

  public static readonly ALL = [ContractKind.VEGETABLES, ContractKind.EGGS]

  public static icon(kind: string) {
    if (kind === ContractKind.VEGETABLES) return 'basket'
    else if (kind === ContractKind.EGGS) return 'egg'
    else return null
  }
}

export type ContractValidation = {
  paperCopies: {
    forAssociation: boolean
    forFarmer: boolean
  }
  cheques: {
    membership: boolean
    vegetables: boolean
    eggs: boolean
  }
  validatedBy: string
}
