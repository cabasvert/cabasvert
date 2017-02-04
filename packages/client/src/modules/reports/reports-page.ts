import { Component } from '@angular/core'

import { NavController, Platform } from 'ionic-angular'

import { Subscription } from "rxjs/Subscription"
import { AuthService, Roles, User } from "../../toolkit/providers/auth-service"
import { Report, ReportService } from "./report.service"
import { BasketPerMonthReport, DistributionChecklistReport, PerYearMemberListReport } from "./reports"

@Component({
  selector: 'page-reports',
  templateUrl: 'reports-page.html',
})
export class ReportsPage {

  user: User
  private subscription: Subscription

  reports = [
    {
      title: 'REPORTS.BASKETS_PER_MONTH_TITLE', icon: "home",
      description: 'REPORTS.BASKETS_PER_MONTH_DESCRIPTION',
      report: BasketPerMonthReport,
      acceptedRoles: [Roles.ADMINISTRATOR],
    },
    {
      title: 'REPORTS.DISTRIBUTION_CHECKLIST_TITLE', icon: "home",
      description: 'REPORTS.DISTRIBUTION_CHECKLIST_DESCRIPTION',
      report: DistributionChecklistReport,
      acceptedRoles: [Roles.ADMINISTRATOR],
    },
    {
      title: 'REPORTS.MEMBER_LIST_TITLE', icon: "home",
      description: 'REPORTS.MEMBER_LIST_DESCRIPTION',
      report: PerYearMemberListReport,
      acceptedRoles: [Roles.ADMINISTRATOR],
    },
  ]

  constructor(public navCtrl: NavController,
              public authService: AuthService,
              public reportsGenerator: ReportService,
              private platform: Platform) {
  }

  ionViewDidLoad() {
    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  writeReport(report: Report) {
    this.platform.ready()
      .then(_ => this.reportsGenerator.writeReport(report))
      .catch(error => console.log(error))
  }
}
