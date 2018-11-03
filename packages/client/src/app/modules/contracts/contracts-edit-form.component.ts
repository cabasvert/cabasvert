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
import { TranslateService } from '@ngx-translate/core'
import { map, switchMap } from 'rxjs/operators'
import { EditFormComponent } from '../../toolkit/dialogs/edit-form.interface'
import { DynamicFormService, DynamicGroup } from '../../toolkit/dynamic-form/dynamic-form.service'
import * as forms from '../../toolkit/dynamic-form/models/form-config.interface'
import { objectAssignNoNulls } from '../../utils/objects'
import { filterNotNull } from '../../utils/observables'
import { SeasonService } from '../seasons/season.service'
import { weekSelect } from '../seasons/week-selector/dynamic-week-select'
import { Contract, ContractFormulas, ContractKind } from './contract.model'

@Component({
  selector: 'contracts-edit-form',
  templateUrl: './contracts-edit-form.component.html',
})
export class ContractsEditForm implements EditFormComponent {

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
              forms.select({
                name: 'formulaId',
                label: 'CONTRACT.FORMULA',
                options: () => ContractFormulas.formulas,
                optionLabel: f => this.translateService.instant(f.label),
                optionValue: f => f.id,
                validator: Validators.required,
              }),
              weekSelect({
                name: 'firstWeek',
                label: 'CONTRACT.FIRST_WEEK',
                season:
                  f => f.get('season').value$.pipe(
                    filterNotNull(),
                    switchMap(sid => this.seasonService.seasonById$(sid)),
                  ),
                validator: Validators.required,
                disabled:
                  (f, g) => g.get('formulaId').value$.pipe(
                    filterNotNull(),
                    map(i => ContractFormulas.formulaForId(i).isNoneFormula()),
                  ),
              }),
              weekSelect({
                name: 'lastWeek',
                label: 'CONTRACT.LAST_WEEK',
                season:
                  f => f.get('season').value$.pipe(
                    filterNotNull(),
                    switchMap(sid => this.seasonService.seasonById$(sid)),
                  ),
                nullAllowed: true,
                disabled:
                  (f, g) => g.get('formulaId').value$.pipe(
                    filterNotNull(),
                    map(i => ContractFormulas.formulaForId(i).isNoneFormula()),
                  ),
              }),
            ],
          }),
        ),
      }),
      forms.group({
        name: 'validation',
        label: 'CONTRACT.VALIDATION',
        icon: 'checkmark',
        controls: [
          forms.checkbox({
            name: 'wish',
            label: 'CONTRACT.WISH',
            value: true,
          }),
          forms.input({
            name: 'validatedBy',
            label: 'CONTRACT.VALIDATED_BY',
            type: 'text',
            validator: Validators.required,
            disabled: (f, g) => g.get('wish').value$,
          }),
          forms.group({
            name: 'paperCopies',
            label: 'CONTRACT.PAPER_COPIES',
            icon: 'paper',
            controls: [
              forms.checkbox({
                name: 'forAssociation',
                label: 'CONTRACT.FOR_ASSOCIATION',
                value: false,
              }),
              forms.checkbox({
                name: 'forFarmer',
                label: 'CONTRACT.FOR_PRODUCER',
                value: false,
              }),
            ],
            disabled: (f, g) => g.get('wish').value$,
          }),
          forms.group({
            name: 'cheques',
            label: 'CONTRACT.CHEQUES',
            icon: 'cash',
            controls: [
              forms.checkbox({
                name: 'vegetables',
                label: 'REF.VEGETABLES',
                value: false,
                disabled:
                  f => f.get('sections.0.formulaId').value$.pipe(
                    filterNotNull(),
                    map(i => ContractFormulas.formulaForId(i).isNoneFormula()),
                  ),
              }),
              forms.checkbox({
                name: 'eggs',
                label: 'REF.EGGS',
                value: false,
                disabled:
                  f => f.get('sections.1.formulaId').value$.pipe(
                    filterNotNull(),
                    map(i => ContractFormulas.formulaForId(i).isNoneFormula()),
                  ),
              }),
            ],
            disabled: (f, g) => g.get('wish').value$,
          }),
        ],
      }),
    ],
  })

  form: DynamicGroup

  contract: Contract

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private dynamicFormService: DynamicFormService,
              private seasonService: SeasonService,
              @Inject(LOCALE_ID) private locale: string,
              private translateService: TranslateService) {

    this.form = this.dynamicFormService.createForm(this.config)
  }

  set data(data: any) {
    this.contract = this.clone(data.contract)

    // Compute formula index in formulas list
    this.formulasToForm(this.contract)

    this.form.patchValue(this.contract)
  }

  get data() {
    // Recompute formula
    this.formulasFromForm(this.form.value)

    return objectAssignNoNulls({}, this.contract, this.form.value)
  }

  get valid() {
    return this.form.valid
  }

  get dirty() {
    return this.form.dirty
  }

  private clone(contract) {
    return JSON.parse(JSON.stringify(contract))
  }

  formulasToForm(contracts) {
    contracts.sections.forEach(s => {
      s.formulaId = ContractFormulas.formulaFor(s.formula).id
    })
  }

  formulasFromForm(contracts) {
    contracts.sections.forEach(s => {
      s.formula = ContractFormulas.formulaForId(s.formulaId).value
      delete s.formulaId
    })
  }
}
