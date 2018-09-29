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

import { formatDate } from '@angular/common';
import { combineLatest, Observable, of, zip } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { groupBy } from '../../utils/arrays';

import { Contract, ContractFormulas, ContractKind } from '../contracts/contract.model';
import { ContractService } from '../contracts/contract.service';
import { DistributionService } from '../distributions/distribution.service';
import { Member } from '../members/member.model';
import { Season } from '../seasons/season.model';

import { Report, ReportHelper, ReportTable } from './report.model';

export class BasketPerMonthReport implements Report {

  generate$(helper: ReportHelper): Observable<ReportTable[]> {
    return zip(
      this.basketsPerMonth(of('legumes'), helper).pipe(
        map(content => ({
          name: 'basketsPerMonth-vegetables',
          title: 'REPORTS.BASKETS_PER_MONTH_VEGETABLES',
          content: content,
          headerRowCount: 1,
          style: this.style,
        })),
      ),
      this.basketsPerMonth(of('oeufs'), helper).pipe(
        map(content => ({
          name: 'basketsPerMonth-eggs',
          title: 'REPORTS.BASKETS_PER_MONTH_EGGS',
          content: content,
          headerRowCount: 1,
          style: this.style,
        })),
      ),
    );
  }

  private basketsPerMonth(basketType$: Observable<string>, helper: ReportHelper): Observable<any[][]> {
    const seasons$ = helper.seasons.latestSeasons$(3);

    const membersIndexed$ = helper.members.allMembersIndexed$;

    const scss$ = seasons$.pipe(
      switchMap(seasons => helper.contracts.contractsForSeasons$(seasons)),
    );

    return combineLatest(basketType$, membersIndexed$, scss$).pipe(
      map(([basketType, msi, scss]) => {

        const sms: { season: Season, month: Date, member: Member, formulaId: string, }[] = [];

        scss.forEach(scs => {
          const { season, contracts } = scs;
          const seasonWeeks = season.seasonWeeks();

          contracts.forEach(c => {
            if (c.type !== 'contract' && c.srev !== 'v1') return;
            if (!c.sections) return;

            c.sections.forEach(s => {
              if (s.kind !== basketType) return;
              if (!s.formula) return;

              const member = msi.get(c.member);
              const monthlyPresence = new Map<string, Date>();
              seasonWeeks.forEach(week => {
                const month: Date = this.monthFor(week);

                const count = DistributionService.basketCount(c, s, week);
                if (count > 0) {
                  monthlyPresence.set(month.toISOString(), month);
                }
              });
              monthlyPresence.forEach(month => {
                sms.push({
                  season: season, month: month, member: member,
                  formulaId: ContractFormulas.formulaFor(s.formula).id,
                });
              });
            });
          });
        });

        const bsByMonth = groupBy(sms, sm => sm.month.toISOString())
          .map(group => ({
            month: group.values[0].month,
            total: group.values.length,
            counts: ContractFormulas.formulas.map(({ id }) =>
              group.values.reduce((acc, v) => v.formulaId === id ? acc + 1 : acc, 0),
            ),
          }))
          .sort((sm1, sm2) => sm1.month.toISOString().localeCompare(sm2.month.toISOString()));

        // TODO Update to take trial baskets in account

        return [
          ['Mois', 'Total',
            ...ContractFormulas.formulas.map(f => helper.translateService.instant(f.label)),
          ],
          ...bsByMonth.map(mc =>
            [this.formatMonth(mc.month), mc.total, ... mc.counts.map(c => '' + c)],
          ),
        ];
      }),
    );
  }

  private style = (row, col) => col === 0 ? 'left' : row === 0 && col >= 2 ? 'rotate' : 'center';

  private formatMonth(date: Date) {
    return formatDate(date, 'MMMM y', 'fr');
  }

  private monthFor(week): Date {
    return new Date(
      week.distributionDate.getFullYear(),
      week.distributionDate.getMonth(),
      1,
    );
  }
}

export class DistributionChecklistReport implements Report {

  generate$(helper: ReportHelper): Observable<ReportTable[]> {
    return zip(
      this.baskets(of('legumes'), helper).pipe(
        map(content => ({
          name: 'distribution-checklist-vegetables',
          title: 'REPORTS.DISTRIBUTION_CHECKLIST_VEGETABLES',
          content: content,
          headerRowCount: 4,
          style: this.style,
        })),
      ),
      this.baskets(of('oeufs'), helper).pipe(
        map(content => ({
          name: 'distribution-checklist-eggs',
          title: 'REPORTS.DISTRIBUTION_CHECKLIST_EGGS',
          content: content,
          headerRowCount: 4,
          style: this.style,
        })),
      ),
    );
  }

  private baskets(basketType$: Observable<string>, helper: ReportHelper): Observable<any[][]> {
    const season$ = helper.seasons.todaysSeason$;

    const membersIndexed$ = helper.members.allMembersIndexed$;

    const cs$: Observable<Contract[]> = season$.pipe(
      switchMap(season => helper.contracts.contractsBySeason$(season)),
    );

    return combineLatest(basketType$, membersIndexed$, season$, cs$).pipe(
      map(([basketType, msi, season, cs]) => {

        const presence = [];

        const seasonWeeks = season.seasonWeeks();

        cs.forEach(c => {
          if (c.type !== 'contract' && c.srev !== 'v1') return;
          if (!c.sections) return;

          c.sections.forEach(s => {
            if (s.kind !== basketType) return;
            if (!s.formula) return;

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

        const totals = presence.reduce((acc, mp) =>
          Array.zip(acc, mp.presence, (a, b) => a + b), seasonWeeks.map(() => 0),
        );

        return [
          ['', '', '', ...seasonWeeks.map(w => w.seasonWeek)],
          ['', '', '', ...seasonWeeks.map(w => this.formatDate(w))],
          ['', '', 'Totals', ...totals],
          ['Nom', 'Prénom', 'Téléphone', ...seasonWeeks.map(() => '')],
          ...presence.map(mp => {
            let p = mp.member.persons[0];
            return [p.lastname, p.firstname, p.phoneNumber, ...mp.presence];
          }).sort(([l1, f1], [l2, f2]) => (l1 + '#' + f1).localeCompare(l2 + '#' + f2)),
        ];
      }),
    );
  }

  private style = (row, col) => row === 1 ? 'rotate' : col < 2 ? 'left' : 'center';

  private formatDate(w) {
    return formatDate(w.distributionDate, 'shortDate', 'fr');
  }
}

export class PerYearMemberListReport implements Report {

  generate$(helper: ReportHelper): Observable<ReportTable[]> {
    return this.memberList(helper).pipe(
      map(content => ([
        {
          name: 'per-year-member-list',
          title: 'REPORTS.MEMBER_LIST_TITLE',
          content: content,
          headerRowCount: 1,
          style: this.style,
        },
      ])),
    );
  }

  private memberList(helper: ReportHelper): Observable<any[][]> {
    const year = new Date().getFullYear();

    const seasons$ = helper.seasons.seasonsForYear$(year);

    const membersIndexed$ = helper.members.allMembersIndexed$;

    const scss$ = seasons$.pipe(
      switchMap(seasons => helper.contracts.contractsForSeasons$(seasons)),
    );

    interface MemberPresence {
      member: Member;
      seasons: Season[];
    }

    return combineLatest(membersIndexed$, seasons$, scss$).pipe(
      map(([msi, seasons, scss]) => {

        const memberPresence = new Map<String, MemberPresence>();

        scss.forEach(({ season, contracts }) => {
          contracts.forEach(contract => {
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

        return [
          ['Nom', 'Prénom', 'Téléphone', 'Courriel', 'Saisons'],
          ...Array.from(memberPresence, ([id, mp]) => {
            let p = mp.member.persons[0];
            let seasonPresence = mp.seasons.map(s => s.name).join(', ');
            return [p.lastname, p.firstname, p.phoneNumber, p.emailAddress, seasonPresence];
          }).sort(([l1, f1], [l2, f2]) => (l1 + '#' + f1).localeCompare(l2 + '#' + f2)),
        ];
      }),
    );
  }

  private style = (row, col) => col < 2 ? 'left' : 'center';
}
