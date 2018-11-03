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

import { Component, Inject, LOCALE_ID } from '@angular/core'
import { Validators } from '@angular/forms'
import { Season } from '@cabasvert/data'

import { ModalController, NavParams } from '@ionic/angular'
import { switchMap } from 'rxjs/operators'
import { EditFormComponent } from '../../toolkit/dialogs/edit-form.interface'
import { DynamicFormService, DynamicGroup } from '../../toolkit/dynamic-form/dynamic-form.service'
import * as forms from '../../toolkit/dynamic-form/models/form-config.interface'
import { objectAssignNoNulls } from '../../utils/objects'
import { filterNotNull } from '../../utils/observables'
import { TrialBasket } from '../members/member.model'
import { MemberService } from '../members/member.service'
import { SeasonService } from '../seasons/season.service'
import { weekSelect } from '../seasons/week-selector/dynamic-week-select'

import { ContractKind } from './contract.model'

@Component({
  selector: 'trial-basket-edit-form',
  templateUrl: 'trial-basket-edit-form.component.html',
})
export class TrialBasketEditForm implements EditFormComponent {

  config = forms.form({
    controls: [
      forms.select<Season>({
        name: 'season',
        label: 'REF.SEASON',
        options: () => this.seasonService.latestSeasons$(),
        optionLabel: season => season.name,
        optionValue: season => season.id,
        validator: Validators.required,
      }),
      weekSelect({
        name: 'week',
        label: 'REF.WEEK',
        season:
          f => f.get('season').value$.pipe(
            filterNotNull(),
            switchMap(sid => this.seasonService.seasonById$(sid)),
          ),
        validator: Validators.required,
      }),
      forms.checkbox({
        name: 'paid',
        label: 'TRIAL_BASKET.PAID',
      }),
      forms.array({
        name: 'sections',
        controls: [ContractKind.VEGETABLES, ContractKind.EGGS].map((kind, index) =>
          forms.group({
            name: index.toString(),
            label: kind === 'legumes' ? 'REF.VEGETABLES' : 'REF.EGGS',
            icon: ContractKind.icon(kind),
            controls: [
              forms.hiddenInput({
                name: 'kind',
                type: 'text',
              }),
              forms.input({
                name: 'count',
                label: 'REF.COUNT',
                type: 'number',
              }),
            ],
          }),
        ),
      }),
    ],
  })

  form: DynamicGroup

  trialBasket: TrialBasket

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private dynamicFormService: DynamicFormService,
              private memberService: MemberService,
              private seasonService: SeasonService,
              @Inject(LOCALE_ID) private locale: string) {

    this.form = this.dynamicFormService.createForm(this.config)
  }

  set data(data: any) {
    this.trialBasket = data.trialBasket

    this.form.patchValue(this.trialBasket)
  }

  get data() {
    return objectAssignNoNulls({}, this.trialBasket, this.form.value)
  }

  get valid() {
    return this.form.valid
  }

  get dirty() {
    return this.form.dirty
  }
}
