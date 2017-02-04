import { Component } from "@angular/core"
import { AlertController, Loading, LoadingController, NavController } from "ionic-angular"
import { AuthService } from "../../toolkit/providers/auth-service"

@Component({
  selector: 'page-change-password',
  templateUrl: './change-password-page.html',
})
export class ChangePasswordPage {
  loading: Loading

  passwords = { oldPassword: null, newPassword: null, confirmedPassword: null, }
  hasPasswordStorage = false
  storePassword = false

  constructor(private auth: AuthService,
              private nav: NavController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController) {
  }

  ionViewWillLoad() {
    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has)

  }

  doChangePassword() {
    this.showLoading()
    return this.auth.changePassword(this.passwords)
      .then(success => {
        if (success) {
          if (this.storePassword) this.auth.maybeStoreCredentials()

          this.loading.dismiss()

          return this.nav.pop()
        } else {
          return this.showError('Access Denied.')
        }
      })
      .catch(error => this.showError(error))
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    })
    this.loading.present()
  }

  showError(text) {
    this.loading.dismiss()

    let alert = this.alertCtrl.create({
      title: 'Fail',
      subTitle: text,
      buttons: ['OK'],
    })
    return alert.present()
  }
}
