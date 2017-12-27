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

import {
  AfterContentInit,
  Component,
  ContentChild,
  ElementRef,
  HostBinding,
  NgZone,
  OnDestroy,
} from "@angular/core"
import { Content, Item, List } from "ionic-angular"
import { Subscription } from "rxjs/Subscription"
import { observeInsideAngular } from "../../utils/observables"
import { fromIonic } from "../utils/ionic-adapter"
import { ItemActions } from "./item-actions"

const ITEM_ACTIONS_HEIGHT = 54

@Component({
  selector: 'ion-item-expanding',
  template: `
    <ng-content select="ion-item,[ion-item]"></ng-content>
    <ng-content select="ion-item-actions"></ng-content>
  `,
  host: {
    'class': 'item-wrapper'
  },
})
export class ItemExpanding implements AfterContentInit, OnDestroy {

  @ContentChild(Item) item: Item
  @ContentChild(ItemActions) itemActions: ItemActions

  @HostBinding('class.expanded')
  private _expanded: boolean = false

  constructor(private list: List,
              private content: Content,
              private zone: NgZone,
              private element: ElementRef) {
  }

  private _subscription: Subscription

  ngAfterContentInit() {
    this._subscription = fromIonic(this.item, 'click')
      .pipe(observeInsideAngular(this.zone))
      .subscribe(() => {
        this.setExpanded(!this._expanded)
      })
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe()
  }

  get expanded(): boolean {
    return this._expanded
  }

  setExpanded(value: boolean) {
    if (this._expanded == value) return

    let oldItem = this._getExpandedItem()
    if (oldItem && oldItem != this) {
      oldItem.setExpanded(false)
    }

    this._expanded = value
    this._setExpandedItem(this._expanded ? this : null)

    // Scroll the outer content so that all of the item and its actions are visible
    if (this._expanded) {
      let top = this.element.nativeElement.offsetTop
      let left = this.element.nativeElement.offsetLeft
      let bottom = top + this.element.nativeElement.offsetHeight + ITEM_ACTIONS_HEIGHT

      let scrollTop = this.content.getContentDimensions().scrollTop
      let scrollBottom = scrollTop + this.content.getContentDimensions().contentHeight

      if (scrollTop > top) {
        this.content.scrollTo(left, top)
      } else if (scrollBottom < bottom) {
        this.content.scrollTo(left, scrollTop + (bottom - scrollBottom))
      }
    }
  }

  _getExpandedItem(): ItemExpanding {
    return this.list._elementRef.nativeElement.__cabasvert_expandedItem
  }

  _setExpandedItem(newItem: ItemExpanding): void {
    this.list._elementRef.nativeElement.__cabasvert_expandedItem = newItem
  }

  open() {
    this.setExpanded(true)
  }

  close() {
    this.setExpanded(false)
  }
}
