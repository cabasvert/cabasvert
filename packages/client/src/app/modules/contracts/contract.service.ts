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

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { DatabaseService } from '../../toolkit/providers/database-service';

import { Member } from '../members/member.model';
import { Season } from '../seasons/season.model';
import { Contract, ContractFormulas, ContractKind, ContractSection } from './contract.model';

@Injectable()
export class ContractService {

  private _perMemberIdProblemSeverity$: Observable<{ [id: string]: string }>;

  constructor(private mainDatabase: DatabaseService) {
    // Per member problem severity on all contracts
    this._perMemberIdProblemSeverity$ = this.getContracts$().pipe(
      map(cs => ContractService.computePerMemberIdProblemSeverity(cs)),
      publishReplay(1),
      refCount(),
    );
  }

  getSeasonContracts$(season: Season): Observable<Contract[]> {
    let query = {
      selector: {
        type: 'contract',
        season: season.id,
      },
    };

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type', 'season'],
      },
    });
    return db$.pipe(
      switchMap(db => db.findAll$(query)),
      map((cs: any[]) => cs.map(c => this.fixContract(c))),
    );
  }

  getContracts$(member: Member = null): Observable<Contract[]> {
    let query = {
      selector: {
        type: 'contract',
      },
    };

    if (member) {
      query.selector['member'] = member._id;
    }

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: member ? ['type', 'member'] : ['type'],
      },
    });
    return db$.pipe(
      switchMap(db => db.findAll$(query)),
      map((cs: any[]) => cs.map(c => this.fixContract(c))),
    );
  }

  private fixContract(contract: any): any {
    if (contract.wish !== undefined) {
      if (!contract.validation) contract.validation = {};
      contract.validation.wish = contract.wish;
      delete contract.wish;
    }
    return contract;
  }

  putContracts$(contracts: Contract): Observable<Contract> {
    return this.mainDatabase.database$.pipe(switchMap(db => db.put$(contracts)));
  }

  removeContracts$(contracts: Contract): Observable<void> {
    return this.mainDatabase.database$.pipe(switchMap(db => db.remove$(contracts)));
  }

  perMemberIdProblemSeverity$(): Observable<{ [id: string]: string }> {
    return this._perMemberIdProblemSeverity$;
  }

  static computePerMemberIdProblemSeverity(cs: Contract[]): { [id: string]: string } {
    return cs.reduce((acc, c) => {
      let problems = ContractService.validateContract(c);
      let severity = ContractService.contractValidationSeverity(problems);

      if (severity) acc[c.member] = severity;
      return acc;
    }, {});
  }

  static contractValidationMessages(problems: { [key: string]: boolean }): string[] {
    let messages = [];
    for (let key of Object.keys(problems)) {
      if (problems[key]) messages.push('CONTRACT.PROBLEM_' + key);
    }
    return messages;
  }

  static contractValidationSeverity(problems: { [key: string]: boolean }, otherSeverity: string = null): string {
    if (Object.keys(problems).length === 0) return otherSeverity;
    if (problems['wish']
      || problems['missingChequesForVegetables']
      || problems['missingChequesForEggs'])
      return 'danger';
    else return otherSeverity ? otherSeverity : 'warning';
  }

  static validateContract(contract: Contract): { [key: string]: boolean } {
    let problems = {};

    if (contract.validation && contract.validation.wish) {
      problems['wish'] = true;
    }

    if (!contract.validation || contract.validation.wish) {
      return problems;
    }

    if (!contract.validation.paperCopies || !contract.validation.paperCopies.forAssociation)
      problems['paperCopyForAssociation'] = true;
    if (!contract.validation.paperCopies || !contract.validation.paperCopies.forFarmer)
      problems['paperCopyForFarmer'] = true;

    let vegetableSection = contract.sections.find(c => c.kind === ContractKind.VEGETABLES);
    let eggSection = contract.sections.find(c => c.kind === ContractKind.EGGS);

    if (!contract.validation.cheques ||
      (!contract.validation.cheques.vegetables && !ContractService.hasNoneFormula(vegetableSection)))
      problems['missingChequesForVegetables'] = true;
    if (!contract.validation.cheques ||
      (!contract.validation.cheques.eggs && !ContractService.hasNoneFormula(eggSection)))
      problems['missingChequesForEggs'] = true;

    return problems;
  }

  public static hasNoneFormula(section: ContractSection) {
    return ContractFormulas.hasNoneFormula(section.formula);
  }

  /* A regular formula is one where you get the same quantity every week */
  public static hasRegularFormula(section: ContractSection) {
    return ContractFormulas.hasRegularFormula(section.formula);
  }
}
