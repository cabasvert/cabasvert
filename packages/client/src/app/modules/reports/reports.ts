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

import { combineLatest, forkJoin, Observable, of, zip } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { groupBy } from '../../utils/arrays';

import { Contract, ContractKind } from '../contracts/contract.model';
import { ContractService } from '../contracts/contract.service';
import { DistributionService } from '../distributions/distribution.service';
import { Member } from '../members/member.model';
import { Season } from '../seasons/season.model';

import { Report, ReportService } from './report.service';

export class BasketPerMonthReport implements Report {

  formulas: Formulas = [
    {
      value: 2,
      label: '2 every week',
    },
    {
      value: [2, 1],
      alternativeValue: 1.5,
      label: 'alternating 2 and 1',
    },
    {
      value: 1,
      label: '1 every week',
    },
    {
      value: [2, 0],
      label: '2 every other week',
    },
    {
      value: [1, 0],
      alternativeValue: .5,
      label: '1 every other week',
    },
  ];

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./basketsPerMonth-vegetables.csv',
      this.basketsPerMonth(of('legumes'), generator).pipe(take(1)),
    );
    generator.writeFile('./basketsPerMonth-eggs.csv',
      this.basketsPerMonth(of('oeufs'), generator).pipe(take(1)),
    );
  }

  private basketsPerMonth(basketType$: Observable<string>, generator: ReportService): Observable<string> {
    const seasons$ = generator.seasons.latestSeasons$(3);

    const membersIndexed$ = generator.members.allMembersIndexed$;
    const css$: Observable<Contract[][]> = seasons$.pipe(
      switchMap(seasons =>
        forkJoin(seasons.map(season =>
          generator.contracts.contractsBySeason$(season).pipe(
            take(1),
          ),
        )),
      ),
    );

    type SeasonContractsPair = [Season, Array<Contract>];
    const scss$: Observable<SeasonContractsPair[]> =
      zip(css$, seasons$, (css, seasons) => ReportService.zip(seasons, css));

    return combineLatest(basketType$, membersIndexed$, scss$,
      (basketType, msi, scss: SeasonContractsPair[]) => {

        const sms: { season: Season, month: Date, member: Member, formula: number, }[] = [];

        scss.forEach(scs => {
          const season = scs[0];
          const seasonWeeks = season.seasonWeeks();

          const cs = scs[1];

          cs.forEach(c => {
            if (c.type !== 'contract' && c.srev !== 'v1') {
              return;
            }
            if (!c.sections) {
              return;
            }

            c.sections.forEach(s => {
              if (s.kind !== basketType) {
                return;
              }
              if (!s.formula) {
                return;
              }

              const member = msi.get(c.member);
              const monthlyPresence = new Map<string, Date>();
              seasonWeeks.forEach(week => {
                const month: Date = ReportService.monthFor(week);

                const count = DistributionService.basketCount(c, s, week);
                if (count > 0) {
                  monthlyPresence.set(month.toISOString(), month);
                }
              });
              monthlyPresence.forEach(month => {
                sms.push({
                  season: season, month: month, member: member,
                  formula: this.findFormula(s.formula),
                });
              });
            });
          });
        });

        const bsByMonth = groupBy(sms, sm => sm.month.toISOString())
          .map(group => ({
            month: group.values[0].month,
            total: group.values.length,
            counts: this.formulas.map((f, i) =>
              group.values.reduce((acc, v) => v.formula === i ? acc + 1 : acc, 0),
            ),
          }))
          .sort((sm1, sm2) => sm1.month.toISOString().localeCompare(sm2.month.toISOString()));

        // TODO Update to take trial baskets in account

        const csv =
          'Mois,Total,' + this.formulas.map(f => f.label).join(',') + '\n' +
          bsByMonth.map(mc => `${this.formatDate(mc.month)},${mc.total},${mc.counts.map(c => '' + c).join(',')}`).join('\n');
        return csv;
      },
    );
  }

  findFormula(value): number {
    return this.formulas.findIndex(f =>
      deepEquals(f.value, value) || (f.alternativeValue && f.alternativeValue === value),
    );
  }

  formatDate(date: Date) {
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
  }
}

type Formulas = {
  value: number | [number, number]
  alternativeValue?: number
  label: string
}[];


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

export class DistributionChecklistReport implements Report {

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./distribution-checklist-vegetables.csv',
      this.baskets(of('legumes'), generator).pipe(take(1)),
    );
    generator.writeFile('./distribution-checklist-eggs.csv',
      this.baskets(of('oeufs'), generator).pipe(take(1)),
    );
  }

  private baskets(basketType$: Observable<string>, generator: ReportService): Observable<string> {
    const season$ = generator.seasons.latestSeason$;

    const membersIndexed$ = generator.members.allMembersIndexed$;
    const cs$: Observable<Contract[]> = season$.pipe(
      switchMap(season =>
        generator.contracts.contractsBySeason$(season).pipe(
          take(1),
        ),
      ),
    );

    interface SeasonContractsPair {
      season: Season;
      contracts: Array<Contract>;
    }

    const scs$: Observable<SeasonContractsPair> = combineLatest(cs$, season$, (css, season) => ({
      season: season,
      contracts: css,
    }));

    return combineLatest(basketType$, membersIndexed$, scs$,
      (basketType, msi, scs: SeasonContractsPair) => {

        const presence = [];

        const season = scs.season;
        const seasonWeeks = season.seasonWeeks();

        const cs = scs.contracts;

        cs.forEach(c => {
          if (c.type !== 'contract' && c.srev !== 'v1') {
            return;
          }
          if (!c.sections) {
            return;
          }

          c.sections.forEach(s => {
            if (s.kind !== basketType) {
              return;
            }
            if (!s.formula) {
              return;
            }

            const member = msi.get(c.member);
            const weeklyPresence = [];
            seasonWeeks.forEach(week => {
              const count = DistributionService.basketCount(c, s, week);
              weeklyPresence.push(count);
            });

            presence.push({ member: member, presence: weeklyPresence });
          });
        });

        // TODO Update to take trial baskets in account

        const formatDate: (d: Date) => string =
          d => '' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();

        const totals = presence
          .reduce((acc, mp) => this.zip(acc, mp.presence, (a, b) => a + b), seasonWeeks.map(_ => 0));

        const csv =
          ',,,' + seasonWeeks.map(w => w.seasonWeek).join(',') + '\n' +
          ',,,' + seasonWeeks.map(w => formatDate(w.distributionDate)).join(',') + '\n' +
          ',,Totals,' + totals.join(',') + '\n' +
          'Nom,Prénom,Téléphone,' + seasonWeeks.map(w => '').join(',') + '\n' +
          presence.map(mp =>
            `${mp.member.persons[0].lastname},${mp.member.persons[0].firstname},${mp.member.persons[0].phoneNumber},` +
            mp.presence.join(','),
          ).join('\n');
        return csv;
      },
    );
  }

  private zip<A, B, C>(a: A[], b: B[], f: (A, B) => C): C[] {
    const c = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      c.push(f(a[i], b[i]));
    }
    return c;
  }
}

export class PerYearMemberListReport implements Report {

  write(fileName: string, generator: ReportService) {
    generator.writeFile('./per-year-member-list.csv',
      this.memberList(generator).pipe(take(1)),
    );
  }

  private memberList(generator: ReportService): Observable<string> {
    const year = new Date().getFullYear();

    const seasons$ = generator.seasons.latestSeasons$(3).pipe(
      map(ss => ss.filter(s =>
        s.contains(new Date('01/01/' + year)) || s.contains(new Date('07/01/' + year)),
      )),
    );

    const membersIndexed$ = generator.members.allMembersIndexed$;

    const css$: Observable<Contract[][]> = seasons$.pipe(
      switchMap(seasons =>
        forkJoin(seasons.map(season =>
          generator.contracts.contractsBySeason$(season).pipe(take(1)),
        )),
      ),
    );

    interface MemberPresence {
      member: Member;
      seasons: Season[];
    }

    const memberPresence = new Map<String, MemberPresence>();

    return combineLatest(membersIndexed$, seasons$, css$,
      (msi, seasons, css: Contract[][]) => {

        type SeasonContractsPair = [Season, Array<Contract>];
        const scss: SeasonContractsPair[] = ReportService.zip(seasons, css);

        scss.reverse();
        scss.forEach(scs => {
          const season: Season = scs[0];
          const cs: Contract[] = scs[1];

          cs.forEach(contract => {
            const section = contract.sections.find(s => s.kind === ContractKind.VEGETABLES);

            if (!section.formula) {
              return;
            }
            if (ContractService.hasNoneFormula(section)) {
              return;
            }

            const memberId = contract.member;
            const member = msi.get(memberId);

            if (memberPresence.has(memberId)) {
              memberPresence.get(memberId).seasons.push(season);
            } else {
              memberPresence.set(memberId, {
                member: member,
                seasons: [season],
              });
            }
          });
        });

        let csv = 'Nom,Prénom,Téléphone,Courriel,Saisons\n';

        memberPresence.forEach(mp => {
          csv += `${mp.member.persons[0].lastname || ''},${mp.member.persons[0].firstname || ''},` +
            `${mp.member.persons[0].phoneNumber || ''},${mp.member.persons[0].emailAddress || ''},` +
            mp.seasons.map(s => s.name).join(' + ') + '\n';
        });
        return csv;
      },
    );
  }
}
