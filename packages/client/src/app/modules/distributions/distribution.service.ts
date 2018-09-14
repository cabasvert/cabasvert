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
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { DatabaseService } from '../../toolkit/providers/database-service';
import '../../utils/dates';

import { Contract, ContractKind, ContractSection } from '../contracts/contract.model';
import { ContractService } from '../contracts/contract.service';
import { Member } from '../members/member.model';
import { MemberService } from '../members/member.service';
import { SeasonWeek } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';

import { Basket, BasketSection, BasketSectionTotals, Distribution } from './distribution.model';

@Injectable()
export class DistributionService implements OnDestroy {

  get todaysBaskets$(): Observable<Basket[]> {
    return this._todaysBaskets$;
  }

  get todaysTotals$(): Observable<{ [kind: string]: BasketSectionTotals }> {
    return this._todaysTotals$;
  }

  private _todaysBaskets$: Observable<Basket[]> =
    this.seasons.todaysSeasonWeek$.pipe(
      switchMap(week => this.getBaskets$(week)),
      publishReplay(1),
      refCount(),
    );

  private _todaysTotals$: Observable<{ [kind: string]: BasketSectionTotals }> =
    this._todaysBaskets$.pipe(
      map(bs => DistributionService.totals(bs)),
      publishReplay(1),
      refCount(),
    );

  private _subscription = new Subscription();

  constructor(private mainDatabase: DatabaseService,
              private seasons: SeasonService,
              private members: MemberService,
              private contracts: ContractService) {

    this._subscription.add(this._todaysTotals$.subscribe());
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  public static basketCount(contract: Contract, section: ContractSection, week: SeasonWeek) {
    let count = DistributionService.basketCountWithoutModifications(section, week);
    const seasonWeek = week.seasonWeek;

    // Take contract amendments in account
    if (contract.amendments) {
      contract.amendments.forEach(a => {
        if (a.week === seasonWeek) {
          const delta = a.deltas[section.kind];
          if (delta) {
            count += delta.count;
          }
        }
      });
    }

    // Take basket postponements in account
    if (contract.postponements) {
      contract.postponements.forEach(p => {
        if (p.week === seasonWeek) {
          const delta = p.deltas[section.kind];
          if (delta) {
            count += delta.count;
          }
        } else if (p.rescheduledWeek === seasonWeek) {
          const delta = p.deltas[section.kind];
          if (delta) {
            count -= delta.count;
          }
        }
      });
    }

    return count;
  }

  private static basketCountWithoutModifications(section: ContractSection, week: SeasonWeek) {
    const weekNumber = week.seasonWeek;
    const doubleDistribution = week.doubleDistribution;

    if (section.firstWeek > weekNumber || (section.lastWeek && section.lastWeek < weekNumber)) {
      return 0;
    }

    let formula = section.formula;

    if (doubleDistribution) {
      if (formula instanceof Array) {
        return formula[0] + formula[1];
      } else {
        return formula * 2;
      }
    }

    const firstWeek = week.season.seasonWeekByNumber(section.firstWeek);
    const isMainWeek = firstWeek.otherWeek === week.otherWeek;
    if (formula instanceof Array) {
      return formula[isMainWeek ? 0 : 1];
    } else {
      if (formula !== parseInt('' + formula, 10)) {
        formula += (isMainWeek ? .5 : -.5);
      }
      return Math.round(formula);
    }
  }

  public static totals(baskets: Basket[] | null): { [kind: string]: BasketSectionTotals } {
    const allCounts: { [kind: string]: BasketSectionTotals } = {};

    function sectionCounts(kind: string): BasketSectionTotals {
      let counts = allCounts[kind];
      if (!counts) {
        counts = { kind, allBasketCount: 0, trialBasketCount: 0 };
        allCounts[kind] = counts;
      }
      return counts;
    }

    if (baskets) {
      baskets.forEach(b => {
        let contractCounted = false;

        ContractKind.ALL.forEach(kind => {
          const section = b.sections[kind];
          if (!section) {
            return;
          }

          const count = section.count;

          if (count > 0) {
            contractCounted = true;
            const counts = sectionCounts(kind);
            counts.allBasketCount += count;
            if (b.isTrial) {
              counts.trialBasketCount += count;
            }
          }
        });

        if (contractCounted) {
          const counts = sectionCounts('cumulative');
          counts.allBasketCount++;
          if (b.isTrial) {
            counts.trialBasketCount++;
          }
        }
      });
    }

    return allCounts;
  }

  private static memberCompare(member1, member2) {
    return (member1.persons[0].lastname + ' ' + member1.persons[0].firstname)
      .localeCompare(member2.persons[0].lastname + ' ' + member2.persons[0].firstname);
  }

  getBaskets$(week: SeasonWeek): Observable<Basket[]> {
    const members$ = this.members.getMembers$();
    const membersIndexed$ = this.members.getMembersIndexed$();
    const contracts$: Observable<Contract[]> = this.contracts.getSeasonContracts$(week.season);

    const trialBaskets$: Observable<Member[]> = members$.pipe(
      map(ms =>
        ms.filter(m => MemberService.memberHasTrialBasketForWeek(m, week)),
      ),
      publishReplay(1),
      refCount(),
    );

    return combineLatest(membersIndexed$, contracts$, trialBaskets$).pipe(
      map(([ms, cs, tbs]) => {

          const baskets = [];

          cs.forEach(c => {
            if (c.type !== 'contract' && c.srev !== 'v1') {
              return;
            }
            if (!c.sections) {
              return;
            }

            const member = ms[c.member];

            const sections: { [kind: string]: BasketSection } = {};
            c.sections.forEach(s => {
              const { kind, formula } = s;
              if (!formula) {
                return;
              }

              const count = DistributionService.basketCount(c, s, week);

              if (count === 0) {
                return;
              }
              sections[kind] = { kind, count };
            });

            if (Object.keys(sections).length === 0) {
              return;
            }
            baskets.push(new Basket(member, sections));
          });

          tbs.forEach(tb => {
            const trialBasket = MemberService.memberGetTrialBasketForWeek(tb, week);
            if (!trialBasket) {
              return;
            }

            const sections: { [kind: string]: BasketSection } = {};
            trialBasket.sections.forEach(s => {
              const { kind, count } = s;

              if (count === 0) {
                return;
              }
              sections[kind] = { kind, count };
            });

            if (Object.keys(sections).length === 0) {
              return;
            }
            baskets.push(new Basket(tb, sections, true));
          });

          return baskets.sort((b1, b2) => DistributionService.memberCompare(b1.member, b2.member));
        },
      ),
    );
  }

  getDistribution$(week: SeasonWeek): Observable<Distribution> {
    const query = {
      selector: {
        type: 'distribution',
        season: week.season.id,
        week: week.seasonWeek,
      },
      limit: 1,
    };

    const db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type', 'season', 'week'],
      },
    });

    const defaultValue = () => Distribution.create(week, this.mainDatabase);
    const mapper = doc => new Distribution(doc, week, this.mainDatabase);
    return db$.pipe(switchMap(db => db.findOne$(query, mapper, defaultValue)));
  }
}

