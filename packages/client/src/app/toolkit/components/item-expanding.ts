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

import { AfterContentInit, Component, ContentChild, ElementRef, HostBinding, NgZone, OnDestroy } from '@angular/core';
import { Content, Item, List } from '@ionic/angular';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { observeInsideAngular } from '../../utils/observables';
import { ItemActions } from './item-actions';

const ITEM_ACTIONS_HEIGHT = 54;

@Component({
  selector: 'ion-item-expanding',
  template: `
    <ng-content select="ion-item"></ng-content>
    <ng-content select="ion-item-actions"></ng-content>
  `,
})
export class ItemExpanding implements AfterContentInit, OnDestroy {

  @ContentChild(Item) item: Item;
  @ContentChild(ItemActions) itemActions: ItemActions;

  @HostBinding('class.expanded') private _expanded = false;
  @HostBinding('class.item-wrapper') private readonly classItemWrapper = true;

  private static _perListExpandedItem: Map<List, ItemExpanding> = new Map();

  constructor(private list: List,
              private content: Content,
              private zone: NgZone,
              private elementRef: ElementRef) {
  }

  private _subscription: Subscription;

  ngAfterContentInit() {
    this._subscription = this._itemClick()
      .pipe(observeInsideAngular(this.zone))
      .subscribe(async () => {
        await this.setExpanded(!this._expanded);
      });
  }

  ngOnDestroy() {
    ItemExpanding._perListExpandedItem.delete(this.list);

    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  get expanded(): boolean {
    return this._expanded;
  }

  async setExpanded(value: boolean) {
    if (this._expanded === value) {
      return;
    }

    const oldItem = this._getExpandedItem();
    if (oldItem && oldItem !== this) {
      await oldItem.setExpanded(false);
    }

    this._expanded = value;
    this._setExpandedItem(this._expanded ? this : null);

    // Scroll the outer content so that all of the item and its actions are visible
    if (this._expanded) {
      let itemElement = this.elementRef.nativeElement.querySelector('ion-item');
      const top = itemElement.offsetTop;
      const left = itemElement.offsetLeft;
      const bottom = top + itemElement.offsetHeight + ITEM_ACTIONS_HEIGHT;

      const scrollElement = await this.content.getScrollElement();

      const scrollTop = scrollElement.scrollTop;
      const scrollBottom = scrollTop + scrollElement.offsetHeight;

      if (scrollTop > top) {
        await this.content.scrollToPoint(left, top, 300);
      } else if (scrollBottom < bottom) {
        await this.content.scrollToPoint(left, scrollTop + (bottom - scrollBottom), 300);
      }
    }
  }

  private _getExpandedItem(): ItemExpanding {
    return ItemExpanding._perListExpandedItem.get(this.list);
  }

  private _setExpandedItem(newItem: ItemExpanding): void {
    ItemExpanding._perListExpandedItem.set(this.list, newItem);
  }

  async open() {
    await this.setExpanded(true);
  }

  async close() {
    await this.setExpanded(false);
  }

  // FIXME This is a hack
  private _itemClick(): Observable<Event> {
    let itemElement = this.elementRef.nativeElement.querySelector('ion-item');
    return fromEvent(itemElement, 'click');
  }
}
