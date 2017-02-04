export type Contract = {
  _id: string
  type: string
  srev: string
  season: string
  member: string
  sections: ContractSection[]
  wish?: boolean
  validation?: ContractValidation
  amendments?: ContractAmendment[]
  postponements?: ContractPostponement[]
}

export type ContractSection = {
  kind: string
  formula: number | [number, number]
  firstWeek: number
  lastWeek?: number
}

export type ContractAmendment = {
  week: number
  deltas: ContractSectionCounts
}

export type ContractPostponement = {
  week: number
  deltas: ContractSectionCounts
  rescheduledWeek: number
}

export type ContractSectionCounts = {
  [kind: string]: {
    kind: string
    count: number
  }
}

export class ContractKind {
  public static readonly VEGETABLES = 'legumes'
  public static readonly EGGS = 'oeufs'

  public static readonly ALL = [ContractKind.VEGETABLES, ContractKind.EGGS]

  public static icon(kind: string) {
    if (kind === ContractKind.VEGETABLES) return 'basket'
    else if (kind === ContractKind.EGGS) return 'egg'
    else return null
  }
}

export type ContractValidation = {
  paperCopies: {
    forAssociation: boolean
    forFarmer: boolean
  }
  cheques: {
    membership: boolean
    vegetables: boolean
    eggs: boolean
  }
  validatedBy: string
}
