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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalController, NavParams } from '@ionic/angular';
import { combineLatest, Observable } from 'rxjs';
import { map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { Forms } from '../../toolkit/utils/forms';
import { objectAssignNoNulls } from '../../utils/objects';

import { ContractKind } from './contract.model';
import { Member, TrialBasket } from '../members/member.model';
import { MemberService } from '../members/member.service';
import { Season, SeasonWeek } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';

@Component({
  selector: 'page-edit-trial-basket',
  templateUrl: 'trial-basket-edit-page.html',
})
export class TrialBasketEditPage implements OnInit {
  form: FormGroup;

  title: string;
  trialBasket: TrialBasket;

  seasons$: Observable<Season[]>;
  weeks$: Observable<SeasonWeek[]>;

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private formBuilder: FormBuilder,
              private memberService: MemberService,
              private seasonService: SeasonService) {

    this.initializeForm();

    this.seasons$ = this.seasonService.lastSeasons$(2);
  }

  private initializeForm() {
    this.form = this.formBuilder.group({
      season: [null, Validators.required],
      week: [1, Validators.required],
      paid: false,
      sections: this.formBuilder.array(
        [ContractKind.VEGETABLES, ContractKind.EGGS].map(kind => {
          const section = this.formBuilder.group({
            kind: [kind, Validators.required],
            count: [1, Validators.required],
          });
          Forms.forceCastAsNumberOrNull(section.get('count'));
          return section;
        }),
      ),
    });
    Forms.forceCastAsNumberOrNull(this.form.get('week'));
  }

  ngOnInit() {
    const selectedSeasonId$ = this.form.get('season').valueChanges.pipe(
      startWith(this.trialBasket.season),
      publishReplay(1),
      refCount(),
    );

    this.weeks$ =
      combineLatest(this.seasons$, selectedSeasonId$).pipe(
        map(([ss, seasonId]) => seasonId == null ? [] : ss.find(s => s.id === seasonId).seasonWeeks()),
        publishReplay(1),
        refCount(),
      );

    if (this.navParams.data) {
      this.title = this.navParams.data.title;
      this.trialBasket = this.navParams.data.trialBasket;

      this.form.patchValue(this.trialBasket);
    }
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async save() {
    await this.modalController.dismiss({
      trialBasket: objectAssignNoNulls({}, this.trialBasket, this.form.value),
    });
  }
}
