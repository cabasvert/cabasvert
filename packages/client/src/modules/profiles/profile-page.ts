import { Component } from "@angular/core"
import { AuthService, User } from "../../toolkit/providers/auth-service"
import { Subscription } from "rxjs/Subscription"
import { Navigation } from "../../toolkit/providers/navigation"
import { ChangePasswordPage } from "./change-password-page"

@Component({
  selector: 'page-profile',
  templateUrl: './profile-page.html',
  providers: [Navigation],
})
export class ProfilePage {

  user: User
  private subscription: Subscription

  constructor(private authService: AuthService,
              private navigator: Navigation) {
  }

  ionViewWillLoad() {
    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  public changePassword() {
    this.navigator.push(ChangePasswordPage, {})
      .subscribe(() => {})
  }
}
