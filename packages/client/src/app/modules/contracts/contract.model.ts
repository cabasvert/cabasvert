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

const { isArray } = Array;

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
  wish?: boolean
  paperCopies?: {
    forAssociation: boolean
    forFarmer: boolean
  }
  cheques?: {
    vegetables?: boolean
    eggs?: boolean
  }
  validatedBy?: string
}

export class ContractFormula {

  constructor(public readonly id: string,
              public readonly value: number | [number, number],
              public readonly alternativeValue: number | null,
              public readonly label: string) {
  }

  isNoneFormula() {
    let value = this.value;
    return (isArray(value) && value[0] === 0 && value[1] === 0) || value === 0;
  }

  isRegularFormula() {
    let value = this.value;
    return (isArray(value) && value[0] === value[1]) || value === parseInt('' + value, 10);
  }

  hasValue(value: number | [number, number]) {
    if (isArray(this.value) && isArray(value)) {
      return this.value[0] === value[0] && this.value[1] === value[1];
    } else {
      return this.value === value || (this.alternativeValue && this.alternativeValue === value);
    }
  }
}

export class ContractFormulas {

  static readonly formulas: ContractFormula[] = [
    new ContractFormula(
      '22',
      2,
      null,
      'CONTRACT.FORMULA_2_EVERY_WEEK',
    ),
    new ContractFormula(
      '21',
      [2, 1],
      1.5,
      'CONTRACT.FORMULA_ALTERNATING_2_AND_1',
    ),
    new ContractFormula(
      '11',
      1,
      null,
      'CONTRACT.FORMULA_1_EVERY_WEEK',
    ),
    new ContractFormula(
      '30',
      [3, 0],
      null,
      'CONTRACT.FORMULA_3_EVERY_OTHER_WEEK',
    ),
    new ContractFormula(
      '20',
      [2, 0],
      null,
      'CONTRACT.FORMULA_2_EVERY_OTHER_WEEK',
    ),
    new ContractFormula(
      '10',
      [1, 0],
      .5,
      'CONTRACT.FORMULA_1_EVERY_OTHER_WEEK',
    ),
    new ContractFormula(
      '0',
      0,
      null,
      'CONTRACT.FORMULA_NONE',
    ),
  ];

  static formulaForId(id: string): ContractFormula {
    return ContractFormulas.formulas.find(f => f.id === id);
  }

  static formulaFor(value: number | [number, number]): ContractFormula {
    return ContractFormulas.formulas.find(f => f.hasValue(value),
    );
  }

  static hasNoneFormula(value: number | [number, number]) {
    return this.formulaFor(value).isNoneFormula();
  }

  static hasRegularFormula(value: number | [number, number]) {
    return this.formulaFor(value).isRegularFormula();
  }
}
