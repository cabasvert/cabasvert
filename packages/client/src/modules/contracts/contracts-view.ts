import { Component, Input } from '@angular/core'
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

  ngOnInit() {
    let problems = ContractService.validateContract(this.contract)
    this.messages = ContractService.contractValidationMessages(problems)
    this.severity = ContractService.contractValidationSeverity(problems)
  }
}
