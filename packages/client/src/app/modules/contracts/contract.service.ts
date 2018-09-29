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

import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, Observable, Subscription, zip } from 'rxjs';
import { map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { DatabaseService } from '../../toolkit/providers/database-service';

import { Member } from '../members/member.model';
import { Season } from '../seasons/season.model';
import { Contract, ContractFormulas, ContractKind, ContractSection } from './contract.model';

@Injectable()
export class ContractService implements OnDestroy {

  public readonly allContracts$: Observable<Contract[]>;
  public readonly perMemberIdProblemSeverity$: Observable<Map<string, string>>;

  private _subscription = new Subscription();

  constructor(private mainDatabase: DatabaseService) {
    this.createIndexes();

    // All contracts
    let query = {
      selector: {
        type: 'contract',
      },
      use_index: 'type',
    };

    this.allContracts$ = this.mainDatabase.findAll$(query, d => this.documentToObject(d));

    // Per member problem severity on all contracts
    this.perMemberIdProblemSeverity$ = this.allContracts$.pipe(
      map(cs => ContractService.computePerMemberIdProblemSeverity(cs)),
      publishReplay(1),
      refCount(),
    );

    this._subscription.add(this.allContracts$.subscribe());
    this._subscription.add(this.perMemberIdProblemSeverity$.subscribe());
  }

  createIndexes() {
    this._subscription.add(
      this.mainDatabase.createIndex({ index: { fields: ['type'], ddoc: 'type' } }),
    );
    this._subscription.add(
      this.mainDatabase.createIndex({
        index: {
          fields: ['type', 'season'],
          ddoc: 'type-season',
        },
      }),
    );
    this._subscription.add(
      this.mainDatabase.createIndex({
        index: {
          fields: ['type', 'member'],
          ddoc: 'type-member',
        },
      }),
    );
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  contractsBySeason$(season: Season): Observable<Contract[]> {
    let query = {
      selector: {
        type: 'contract',
        season: season.id,
      },
      use_index: 'type-season',
    };

    return this.mainDatabase.findAll$(query, d => this.documentToObject(d));
  }

  contractsByMember$(member: Member): Observable<Contract[]> {
    let query = {
      selector: {
        type: 'contract',
        member: member._id,
      },
      use_index: 'type-member',
    };

    return this.mainDatabase.findAll$(query, d => this.documentToObject(d));
  }

  contractsForSeasons$(seasons: Season[]): Observable<SeasonContractsPair[]> {
    const css$: Observable<Contract[][]> =
      combineLatest(seasons.map(season => this.contractsBySeason$(season)));

    return css$.pipe(
      map(css => css.map((cs, index) => ({ season: seasons[index], contracts: cs }))),
    );
  }

  private documentToObject(contract: any): any {
    if (contract.wish !== undefined) {
      if (!contract.validation) contract.validation = {};
      contract.validation.wish = contract.wish;
      delete contract.wish;
    }
    return contract;
  }

  putContracts$(contracts: Contract): Observable<Contract> {
    let doc = this.objectToDocument(contracts);
    return this.mainDatabase.put$(doc);
  }

  removeContracts$(contracts: Contract): Observable<void> {
    let doc = this.objectToDocument(contracts);
    return this.mainDatabase.remove$(doc);
  }

  private objectToDocument(contract: any): any {
    if (contract.validation.wish !== undefined) {
      contract.wish = contract.validation.wish;
      delete contract.validation.wish;
    }
    return contract;
  }

  static computePerMemberIdProblemSeverity(cs: Contract[]): Map<string, string> {
    return cs.reduce((acc, c) => {
      let problems = ContractService.validateContract(c);
      let severity = ContractService.contractValidationSeverity(problems);

      if (severity) acc.set(c.member, severity);
      return acc;
    }, new Map());
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

export interface SeasonContractsPair {
  season: Season;
  contracts: Array<Contract>;
}
