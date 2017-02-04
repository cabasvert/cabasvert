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
