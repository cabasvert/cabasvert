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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ReportTable } from './report.model';

import { ReportService} from './report.service';

@Component({
  selector: 'page-report-result',
  templateUrl: 'report-result-page.html',
  styleUrls: ['report-result-page.scss'],
})
export class ReportResultPage implements OnInit {

  reportTitle: string;

  tables$: Observable<ReportTable[]>;

  constructor(private router: Router,
              private navCtrl: NavController,
              private route: ActivatedRoute,
              private reportsGenerator: ReportService) {
  }

  ngOnInit() {
    let reportName$ = this.route.paramMap.pipe(
      map(params => params.get('name')),
    );
    this.tables$ = reportName$.pipe(
      switchMap(report => this.reportsGenerator.generate$(report)),
    );
  }

  dismiss() {
    this.navCtrl.goBack();
  }
}
