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
import { Season, SeasonWeek } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';
import { Contract, ContractFormula, ContractFormulas, ContractKind } from './contract.model';
import { ContractService } from './contract.service';

@Component({
  selector: 'page-edit-contracts',
  templateUrl: './contracts-edit-page.html',
})
export class ContractsEditPage implements OnInit {

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private formBuilder: FormBuilder,
              private seasonService: SeasonService) {

    this.initializeForm();

    this.seasons$ = this.seasonService.lastSeasons$(2);
  }

  Kinds = ContractKind;

  form: FormGroup;

  title: string;
  contract: Contract;

  seasons$: Observable<Season[]>;
  weeks$: Observable<SeasonWeek[]>;

  formulas: ContractFormula[] = ContractFormulas.formulas;

  private initializeForm() {
    this.form = this.formBuilder.group({
      season: [null, Validators.required],
      sections: this.formBuilder.array(
        [ContractKind.VEGETABLES, ContractKind.EGGS].map(kind => {
          const section = this.formBuilder.group({
            kind: [kind, Validators.required],
            formulaIndex: [1, Validators.required],
            firstWeek: [1, Validators.required],
            lastWeek: null,
          });
          Forms.forceCastAsNumberOrNull(section.get('firstWeek'));
          Forms.forceCastAsNumberOrNull(section.get('lastWeek'));
          return section;
        }),
      ),
      wish: true,
      validation: this.formBuilder.group({
        paperCopies: this.formBuilder.group({
          forAssociation: false,
          forFarmer: false,
        }),
        cheques: this.formBuilder.group({
          vegetables: false,
          eggs: false,
        }),
        validatedBy: ['', Validators.required],
      }, {
        validator: Validators.required,
      }),
    });
  }

  ngOnInit() {
    const wishControl = this.form.get('wish');
    this.wishValueChanged(wishControl.value);
    wishControl.valueChanges.subscribe(v => {
      this.wishValueChanged(v);
    });

    const selectedSeasonId$ = this.form.get('season').valueChanges.pipe(
      startWith(this.contract.season),
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
      this.contract = this.clone(this.navParams.data.contract);

      // Compute formula index in formulas list
      this.formulasToForm(this.contract);

      this.form.patchValue(this.contract);
    }
  }

  private clone(contract) {
    return JSON.parse(JSON.stringify(contract));
  }

  private wishValueChanged(v) {
    const validation = this.form.get('validation');
    if (v) {
      validation.disable();
    } else {
      validation.enable();

      // This is a temporary hack until ionic-team/ionic#12359 is fixed
      const field = document.getElementById('validatedBy');
      if (field === null) {
        return;
      }
      const children = field.getElementsByTagName('input');
      if (children.length > 0) {
        children[0].removeAttribute('disabled');
      }
    }
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async save() {
    // Recompute formula
    this.formulasFromForm(this.form.value);

    await this.modalController.dismiss(objectAssignNoNulls({}, this.contract, this.form.value));
  }

  hasNoneFormula(kind: string) {
    let contracts: Contract = this.form.value;

    // Recompute formula
    this.formulasFromForm(contracts);

    let contractSection = contracts.sections.find(s => s.kind === kind);
    return ContractService.hasNoneFormula(contractSection);
  }

  formulasFor(kind: string) {
    return this.formulas;
  }

  private formulaToFormulaIndex(value): number {
    return ContractFormulas.formulaIndexFor(value);
  }

  private formulaIndexToFormula(formulaIndex) {
    return this.formulas[formulaIndex].value;
  }

  formulasToForm(contracts) {
    contracts.sections.forEach(s => {
      s.formulaIndex = this.formulaToFormulaIndex(s.formula);
    });
  }

  formulasFromForm(contracts) {
    contracts.sections.forEach(s => {
      s.formula = this.formulaIndexToFormula(s.formulaIndex);
    });
  }
}
