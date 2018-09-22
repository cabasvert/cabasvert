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
import { Component, Inject, LOCALE_ID, OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';

import { ModalController, NavParams } from '@ionic/angular';
import { map, switchMap } from 'rxjs/operators';
import { DynamicFormService, DynamicGroup } from '../../toolkit/dynamic-form/dynamic-form.service';
import { ControlConfig, FormConfig } from '../../toolkit/dynamic-form/models/form-config.interface';
import { objectAssignNoNulls } from '../../utils/objects';
import { filterNotNull } from '../../utils/observables';
import { TrialBasket } from '../members/member.model';
import { MemberService } from '../members/member.service';
import { SeasonService } from '../seasons/season.service';

import { ContractKind } from './contract.model';

@Component({
  selector: 'page-edit-trial-basket',
  templateUrl: 'trial-basket-edit-page.html',
})
export class TrialBasketEditPage implements OnDestroy {

  config: FormConfig = {
    controls: [
      {
        name: 'season',
        label: 'REF.SEASON',
        kind: 'select',
        options: () => this.seasonService.latestSeasons$(),
        optionLabel: season => season.name,
        optionValue: season => season.id,
        validator: Validators.required,
      },
      {
        name: 'week',
        label: 'REF.WEEK',
        kind: 'select',
        options:
          form => form.get('season').value$.pipe(
            filterNotNull(),
            switchMap(sid => this.seasonService.seasonById$(sid)),
            map(s => s.seasonWeeks()),
          ),
        optionLabel: week => this.formatWeek(week),
        optionValue: week => week.seasonWeek,
        validator: Validators.required,
      },
      {
        name: 'paid',
        label: 'TRIAL_BASKET.PAID',
        kind: 'checkbox',
      },
      {
        name: 'sections',
        kind: 'array',
        controls: [ContractKind.VEGETABLES, ContractKind.EGGS].map((kind, index) => ({
          name: index.toString(),
          label: kind === 'legumes' ? 'REF.VEGETABLES' : 'REF.EGGS',
          icon: ContractKind.icon(kind),
          kind: 'group',
          controls: [
            {
              name: 'kind',
              kind: 'hidden-input',
              type: 'text',
            },
            {
              name: 'count',
              label: 'REF.COUNT',
              kind: 'input',
              type: 'number',
            },
          ],
        } as ControlConfig)),
      },
    ],
  };

  form: DynamicGroup;

  title: string;
  trialBasket: TrialBasket;

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private dynamicFormService: DynamicFormService,
              private memberService: MemberService,
              private seasonService: SeasonService,
              @Inject(LOCALE_ID) private locale: string) {

    this.form = this.dynamicFormService.createForm(this.config);

    if (this.navParams.data) {
      this.title = this.navParams.data.title;
      this.trialBasket = this.navParams.data.trialBasket;

      this.form.patchValue(this.trialBasket);
    }
  }

  ngOnDestroy() {
    this.form.destroy();
  }

  private formatWeek(week) {
    return formatDate(week.distributionDate, 'shortDate', this.locale) +
      ' (' + week.seasonWeek + ')';
  }

  async cancel() {
    await this.modalController.dismiss(null, 'cancel');
  }

  async save() {
    let data = objectAssignNoNulls({}, this.trialBasket, this.form.value);
    await this.modalController.dismiss(data, 'save');
  }
}
