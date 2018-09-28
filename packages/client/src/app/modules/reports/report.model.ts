import { TranslateService } from '@ngx-translate/core';
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
import { Observable } from 'rxjs';
import { ContractService } from '../contracts/contract.service';
import { MemberService } from '../members/member.service';
import { SeasonService } from '../seasons/season.service';

export interface ReportDescription {
  name: string;
  title: string;
  icon: string;
  description: string;
  report: new () => Report;
  acceptedRoles: string[];
}

export interface ReportHelper {
  seasons: SeasonService;
  members: MemberService;
  contracts: ContractService;
  translateService: TranslateService;
}

export interface Report {
  generate$(generator: ReportHelper): Observable<ReportTable[]>;
}

export interface ReportTable {
  name: string;
  title: string;
  content: any[][];
  headerRowCount: number;
  style: (row, col) => string;
}
