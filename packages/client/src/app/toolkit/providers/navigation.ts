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

import { Injectable } from '@angular/core';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { AlertOptions, ModalOptions, NavOptions } from '@ionic/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EditDialogComponent, EditFormOptions } from '../dialogs/edit-dialog.component';

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
              return true;
            };
          } else {
            b.handler = data => {
              if (b.role) {
                data['button'] = b.role;
              }
              observer.next(data);
              return true;
            };
          }
          return b;
        }
      });
      this.alertCtrl.create(opts)
        .then(alert => {
          alert.onDidDismiss().then(() => {
            observer.complete();
          });
          return alert.present();
        })
        .catch(e => observer.error(e));
    });
  }

  showModal$(opts ?: ModalOptions): Observable<any> {
    return new Observable(observer => {
      this.modalCtrl.create(opts)
        .then(modal => {
          modal.onDidDismiss().then(r => {
            observer.next(r);
            observer.complete();
          });
          return modal.present();
        })
        .catch(e => observer.error(e));
    });
  }

  showEditDialog$(opts ?: EditFormOptions): Observable<any> {
    return this.showModal$({
      component: EditDialogComponent,
      componentProps: opts,
    }).pipe(
      filter(r => r.role === 'save'),
      map(r => r.data),
    );
  }
}
