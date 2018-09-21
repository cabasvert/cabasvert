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
  public static readonly VEGETABLES = 'legumes';
  public static readonly EGGS = 'oeufs';

  public static readonly ALL = [ContractKind.VEGETABLES, ContractKind.EGGS];

  public static icon(kind: string) {
    if (kind === ContractKind.VEGETABLES) return 'basket';
    else if (kind === ContractKind.EGGS) return 'egg';
    else return null;
  }
}

export type ContractValidation = {
  paperCopies: {
    forAssociation: boolean
    forFarmer: boolean
  }
  cheques: {
    vegetables: boolean
    eggs: boolean
  }
  validatedBy: string
}

export class ContractFormulas {

  static readonly formulas: ContractFormula[] = [
    {
      value: 2,
      label: 'CONTRACT.FORMULA_2_EVERY_WEEK',
    },
    {
      value: [2, 1],
      alternativeValue: 1.5,
      label: 'CONTRACT.FORMULA_ALTERNATING_2_AND_1',
    },
    {
      value: 1,
      label: 'CONTRACT.FORMULA_1_EVERY_WEEK',
    },
    {
      value: [2, 0],
      label: 'CONTRACT.FORMULA_2_EVERY_OTHER_WEEK',
    },
    {
      value: [1, 0],
      alternativeValue: .5,
      label: 'CONTRACT.FORMULA_1_EVERY_OTHER_WEEK',
    },
    {
      value: 0,
      label: 'CONTRACT.FORMULA_NONE',
    },
  ];

  static formulaIndexFor(value: number | [number, number]): number {
    return ContractFormulas.formulas.findIndex(f =>
      deepEquals(f.value, value) || (f.alternativeValue && f.alternativeValue === value),
    );
  }

  static formulaFor(value: number | [number, number]): ContractFormula {
    return ContractFormulas.formulas[ContractFormulas.formulaIndexFor(value)];
  }

  static hasNoneFormula(value: number | [number, number]) {
    return (value instanceof Array && value[0] === 0 && value[1] === 0) || value === 0;
  }

  static hasRegularFormula(value: number | [number, number]) {
    return (value instanceof Array && value[0] === value[1]) || value === parseInt('' + value, 10);
  }
}

export interface ContractFormula {
  value: number | [number, number];
  alternativeValue?: number;
  label: string;
}

function deepEquals(a, b): boolean {
  if (a instanceof Array && b instanceof Array) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else {
    return a === b;
  }
}
