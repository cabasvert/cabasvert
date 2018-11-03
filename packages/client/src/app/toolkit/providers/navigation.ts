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

import { Injectable } from '@angular/core'
import { AlertController, ModalController, NavController } from '@ionic/angular'
import { AlertOptions, ModalOptions, NavOptions, OverlayEventDetail } from '@ionic/core'
import { defer, Observable } from 'rxjs'
import { fromPromise } from 'rxjs/internal-compatibility'
import { filter, map } from 'rxjs/operators'
import { EditDialogComponent, EditFormOptions } from '../dialogs/edit-dialog.component'

@Injectable()
export class Navigation {

  constructor(public navCtrl: NavController,
              public modalCtrl: ModalController,
              public alertCtrl: AlertController) {
  }

  showAlert$(opts?: AlertOptions): Observable<any> {
    return new Observable(observer => {
      opts.buttons = opts.buttons.map(b => {
        if (typeof b !== 'string') {
          if (b.role === 'cancel') {
            b.handler = () => {
              return true
            }
          } else {
            b.handler = data => {
              if (b.role) {
                data['button'] = b.role
              }
              observer.next(data)
              return true
            }
          }
          return b
        }
      })
      this.alertCtrl.create(opts)
        .then(alert => {
          alert.onDidDismiss().then(() => {
            observer.complete()
          })
          return alert.present()
        })
        .catch(e => observer.error(e))
    })
  }

  showModal$(opts?: ModalOptions): Observable<OverlayEventDetail<any>> {
    return defer(() => fromPromise(this.showModal(opts)))
  }

  async showModal(opts?: ModalOptions): Promise<OverlayEventDetail<any>> {
    const modal = await this.modalCtrl.create(opts)
    await modal.present()
    return await modal.onDidDismiss()
  }

  showEditDialog$(opts?: EditFormOptions): Observable<any> {
    return defer(() =>
      fromPromise(this.showEditDialog(opts)).pipe(
        filter(r => r.role === 'save'),
        map(r => r.data),
      ),
    )
  }

  async showEditDialog(opts?: EditFormOptions): Promise<OverlayEventDetail<any>> {
    return await this.showModal({
      component: EditDialogComponent,
      componentProps: opts,
      backdropDismiss: false,
    })
  }
}
