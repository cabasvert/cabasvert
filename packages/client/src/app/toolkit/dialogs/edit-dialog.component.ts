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

import { Component, ComponentFactoryResolver, OnInit, Type, ViewChild } from '@angular/core';

import { ModalController, NavParams } from '@ionic/angular';
import { EditFormHostDirective } from './edit-form-host.directive';
import { EditFormComponent } from './edit-form.interface';
import { Person } from './member.model';
import { MemberService } from './member.service';

export interface EditFormOptions {
  component: Type<any>;
  data: any;
}

@Component({
  selector: 'edit-dialog',
  templateUrl: 'edit-dialog.component.html',
})
export class EditDialogComponent implements OnInit {

  title: string;
  @ViewChild(EditFormHostDirective) host: EditFormHostDirective;
  editFormInstance: EditFormComponent;

  constructor(public navParams: NavParams,
              public modalController: ModalController,
              private componentFactoryResolver: ComponentFactoryResolver) {

  }

  ngOnInit() {
    let editFormOptions: EditFormOptions = <EditFormOptions> this.navParams.data;

    if (editFormOptions) {
      this.loadFormComponent(editFormOptions);
    }
  }

  loadFormComponent(editFormOptions: any) {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(editFormOptions.component);

    let viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();

    let componentRef = viewContainerRef.createComponent(componentFactory);
    this.editFormInstance = <EditFormComponent> componentRef.instance;
    this.editFormInstance.data = editFormOptions.data;

    this.title = this.editFormInstance.title;
  }

  get isFormValid() {
    return this.editFormInstance.valid;
  }

  async cancel() {
    await this.modalController.dismiss(null, 'cancel');
  }

  async save() {
    await this.modalController.dismiss(this.editFormInstance.data, 'save');
  }
}
