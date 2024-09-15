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

import { AfterViewInit, Component, ComponentFactoryResolver, OnInit, Type, ViewChild } from '@angular/core'

import { AlertController, ModalController, NavParams } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { EditFormHostDirective } from './edit-form-host.directive'
import { EditFormComponent } from './edit-form.interface'
import { Person } from './member.model'
import { MemberService } from './member.service'

export interface EditFormOptions {
  component: Type<any>
  data: any
  isNewData: boolean
  title: string
  discardTitle: string
  discardText: string
}

@Component({
  selector: 'edit-dialog',
  templateUrl: 'edit-dialog.component.html',
})
export class EditDialogComponent implements OnInit {

  title: string

  private editFormOptions: EditFormOptions

  @ViewChild(EditFormHostDirective, { static: true }) host: EditFormHostDirective
  editFormInstance: EditFormComponent

  constructor(private navParams: NavParams,
              private modalCtrl: ModalController,
              private alertCtrl: AlertController,
              private translate: TranslateService) {
  }

  ngOnInit() {
    this.editFormOptions = <EditFormOptions> this.navParams.data

    if (this.editFormOptions) {
      this.loadFormComponent(this.editFormOptions)
    }
  }

  loadFormComponent(editFormOptions: EditFormOptions) {
    let viewContainerRef = this.host.viewContainerRef
    viewContainerRef.clear()

    let componentRef = viewContainerRef.createComponent(editFormOptions.component)
    this.editFormInstance = <EditFormComponent> componentRef.instance
    this.editFormInstance.data = editFormOptions.data

    this.title = this.editFormOptions.title
  }

  get canSave() {
    return (this.editFormOptions.isNewData || this.editFormInstance.dirty) && this.editFormInstance.valid
  }

  async discard() {
    // TODO Move to ionWillDismiss handler when ionic-team/ionic#15848 is fixed
    if (this.editFormInstance.dirty) {
      const confirmationAlert = await this.alertCtrl.create({
        header: this.translate.instant(this.editFormOptions.discardTitle),
        message: this.translate.instant(this.editFormOptions.discardText),
        buttons: [
          {
            text: this.translate.instant('DIALOGS.CANCEL'),
            role: 'cancel',
          },
          {
            text: this.translate.instant('DIALOGS.DISCARD'),
            role: 'discard',
          },
        ],
      })
      await confirmationAlert.present()
      const { role } = await confirmationAlert.onDidDismiss()
      if (role !== 'discard') return
    }
    await this.modalCtrl.dismiss(null, 'discard')
  }

  async save() {
    await this.modalCtrl.dismiss(this.editFormInstance.data, 'save')
  }
}
