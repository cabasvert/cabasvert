export interface Member {
  _id: string
  persons: Person[]
  trialBaskets?: TrialBasket[]
}

export type Person = {
  firstname, lastname: string
  address?: string
  phoneNumber?: string
  emailAddress?: string
}

export type TrialBasket = {
  season: string,
  week: number,
  paid: boolean,
  sections: { kind: string, count: number }[]
}
