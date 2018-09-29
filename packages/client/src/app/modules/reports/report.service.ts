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

import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Roles } from '../../toolkit/providers/auth-service';
import { observeInsideAngular } from '../../utils/observables';

import { ContractService } from '../contracts/contract.service';
import { MemberService } from '../members/member.service';
import { SeasonService } from '../seasons/season.service';

import { ReportDescription, ReportHelper, ReportTable } from './report.model';
import {
  BasketPerMonthReport,
  DistributionChecklistReport,
  PerYearMemberListReport,
} from './reports';

const REPORTS = [
  {
    name: 'baskets-per-month',
    title: 'REPORTS.BASKETS_PER_MONTH_TITLE', icon: 'home',
    description: 'REPORTS.BASKETS_PER_MONTH_DESCRIPTION',
    report: BasketPerMonthReport,
    acceptedRoles: [Roles.ADMINISTRATOR],
  },
  {
    name: 'distribution-checklist',
    title: 'REPORTS.DISTRIBUTION_CHECKLIST_TITLE', icon: 'home',
    description: 'REPORTS.DISTRIBUTION_CHECKLIST_DESCRIPTION',
    report: DistributionChecklistReport,
    acceptedRoles: [Roles.ADMINISTRATOR],
  },
  {
    name: 'member-list',
    title: 'REPORTS.MEMBER_LIST_TITLE', icon: 'home',
    description: 'REPORTS.MEMBER_LIST_DESCRIPTION',
    report: PerYearMemberListReport,
    acceptedRoles: [Roles.ADMINISTRATOR],
  },
];

@Injectable()
export class ReportService implements ReportHelper {

  constructor(public seasons: SeasonService,
              public members: MemberService,
              public contracts: ContractService,
              public translateService: TranslateService,
              private ngZone: NgZone) {
  }

  public readonly reports: ReportDescription[] = REPORTS;

  public reportByName(name: string): ReportDescription {
    return this.reports.find(r => r.name === name);
  }

  public generate$(name: string): Observable<ReportTable[]> {
    let report = this.reportByName(name).report;
    return new report().generate$(this).pipe(
      observeInsideAngular(this.ngZone),
    );
  }

  public writeReport(name: string) {
    this.generate$(name).subscribe(tables => {
      tables.forEach(table => {
        this.writeFile(`./${table.name}.csv`, ReportService.toCSV(table.content));
      });
    });
  }

  private writeFile(fileName: string, csv: string) {
    // TODO Should we use Capacitor's Filesystem plugin ?
  }

  private static toCSV(values: any[][]) {
    return values.map(rows => rows.map(v => v ? v.toString() : '').join(',')).join('\n');
  }
}
