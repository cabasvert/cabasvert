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

import { switchMap } from "rxjs/operators"

import { DatabaseService } from "../../toolkit/providers/database-service"

import { Member } from "../members/member.model"
import { SeasonWeek } from "../seasons/season.model"

export class Distribution {
  private _doc: any

  week: SeasonWeek
  // TODO Use a dictionary to avoid inconsistencies
  baskets: {
    member: string
    sections: { [kind: string]: BasketSection }
    distributed?: boolean
    delayed?: boolean
    date?: string
    note?: {
      content: string
    }
  }[]

  static createDoc(week: SeasonWeek) {
    let doc = {
      _id: this.createDocId(week),
      type: 'distribution',
      srev: 'v1',
      season: week.season.id,
      week: week.seasonWeek,
      // distributorId: string,
      baskets: [],
    }
    return doc
  }

  private static createDocId(week: SeasonWeek) {
    return 'distribution:' + week.season.id.substring("season:".length) + '-' + week.seasonWeek
  }

  constructor(doc: any, week: SeasonWeek, private mainDatabase: DatabaseService) {
    this._doc = doc
    this.week = week
    this.baskets = this._doc.baskets
  }

  updateDatabase() {
    if (!this._doc.srev) {
      this._doc.srev = 'v1'
    }
    this.mainDatabase.database$.pipe(switchMap(db => db.put$(this._doc))).subscribe()
  }

  isBasketDistributed(basket: Basket) {
    let found = this.findByBasket(basket)
    return found && found.distributed
  }

  toggleBasketDistributed(basket: Basket) {
    let found = this.findByBasket(basket)
    if (found) {
      found.distributed = !found.distributed
      if (found.distributed) found.date = new Date().toISOString()
    } else {
      this.addForBasket(basket, true, false, new Date())
    }
    this.updateDatabase()
  }

  isBasketDelayed(basket: Basket) {
    let found = this.findByBasket(basket)
    return found && found.delayed
  }

  isBasketPrepared(basket: Basket) {
    let found = this.findByBasket(basket)
    return found && found.delayed && found.distributed
  }

  toggleBasketDelayed(basket: Basket) {
    let found = this.findByBasket(basket)
    if (found) {
      found.delayed = !found.delayed
    } else {
      this.addForBasket(basket, false, true)
    }
    this.updateDatabase()
  }

  pushNoteToBasket(basket: Basket, note?: { content: string }) {
    if (note && note.content == '') note = null

    let found = this.findByBasket(basket)
    if (found) {
      found.note = note
    } else {
      if (!note) return
      this.addForBasket(basket, false, false, new Date(), note)
    }
    this.updateDatabase()
  }

  isBasketHaveNote(basket: Basket) {
    let found = this.findByBasket(basket)
    return found && found.note
  }

  getNoteFromBasket(basket: Basket): { content: string } {
    let found = this.findByBasket(basket)
    return found ? found.note : null
  }

  getBasketDistributionDate(basket: Basket) {
    let found = this.findByBasket(basket)
    return found && found.date ? new Date(found.date) : null
  }

  private findByBasket(basket: Basket) {
    let id = basket.member._id
    let found = this.baskets.find((b) => b.member == id)
    return found
  }

  private addForBasket(basket: Basket, distributed: boolean, delayed: boolean, date?: Date, note?: { content: string }) {
    let item = {
      member: basket.member._id,
      sections: basket.sections,
    }
    if (distributed) item['distributed'] = true
    if (delayed) item['delayed'] = true
    if (date) item['date'] = date.toISOString()
    if (note) item['note'] = note
    this.baskets.push(item)
  }

  distributedCount() {
    return this.baskets.reduce((a, b) => a + (b.distributed ? 1 : 0), 0)
  }

  delayedCount() {
    return this.baskets.reduce((a, b) => a + (b.delayed && !b.distributed ? 1 : 0), 0)
  }

  preparedCount() {
    return this.baskets.reduce((a, b) => a + (b.delayed && b.distributed ? 1 : 0), 0)
  }
}

export class Basket {
  constructor(public member: Member, public sections: { [kind: string]: BasketSection }, public isTrial: boolean = false) {
  }
}

export type BasketSection = {
  kind: string
  count: number
}

export type BasketSectionTotals = {
  kind: string
  allBasketCount: number
  trialBasketCount: number
}
