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

import { Component, Input } from '@angular/core'
import { SeasonService } from "../seasons/season.service"
import { ContractService } from "./contract.service"
import { Contract, ContractKind } from "./contract.model"

@Component({
  selector: 'contracts-view',
  templateUrl: './contracts-view.html',
})
export class ContractsView {
  @Input() contract: Contract

  messages: string[]
  severity: string

  Kinds = ContractKind

  JSON = JSON

  constructor(public seasonService: SeasonService) {
  }

  ngOnInit() {
    let problems = ContractService.validateContract(this.contract)
    this.messages = ContractService.contractValidationMessages(problems)
    this.severity = ContractService.contractValidationSeverity(problems)
  }
}
