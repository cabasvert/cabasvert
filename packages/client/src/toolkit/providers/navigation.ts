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

import { Injectable } from "@angular/core"
import {
  AlertController,
  AlertOptions,
  ModalController,
  ModalOptions,
  NavController,
  NavOptions,
} from "ionic-angular"
import { Observable } from "rxjs/Observable"

@Injectable()
export class Navigation {

  constructor(public navCtrl: NavController,
              public modalCtrl: ModalController,
              public alertCtrl: AlertController) {
  }

  alert(opts?: AlertOptions): Observable<any> {
    return new Observable(observer => {
      opts.buttons = opts.buttons.map(b => {
        if (typeof b !== 'string') {
          if (b.role == 'cancel') {
            b.handler = data => {
              return true
            }
          } else {
            b.handler = data => {
              if (b.role) data['button'] = b.role
              observer.next(data)
              return true
            }
          }
          return b
        }
      })
      let alert = this.alertCtrl.create(opts)
      alert.present()
        .catch(e => observer.error(e))
      alert.onDidDismiss(r => {
        observer.complete()
      })
    })
  }

  showModal(component: any, data ?: any, opts ?: ModalOptions): Observable<any> {
    return new Observable(observer => {
      let modal = this.modalCtrl.create(component, data, opts)
      modal.present()
        .catch(e => observer.error(e))
      modal.onDidDismiss(r => {
        observer.next(r)
        observer.complete()
      })
    })
  }

  push(component: any, data ?: any, opts ?: NavOptions): Observable<any> {
    return new Observable(observer => {
      let transition = this.navCtrl.push(component, data, opts)
      transition
        .catch(e => observer.error(e))
        .then(() => {
          let viewCtrl = this.navCtrl.getActive(true)
          viewCtrl.onDidDismiss(r => {
            observer.next(r)
            observer.complete()
          })
        })
    })
  }
}
