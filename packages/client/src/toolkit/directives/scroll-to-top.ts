import { Directive, NgZone, OnDestroy, OnInit } from "@angular/core"
import { Content, ScrollEvent } from "ionic-angular"
import { defer } from "rxjs/observable/defer"
import { delay, filter, switchMap, switchMapTo } from "rxjs/operators"
import { Subscription } from "rxjs/Subscription"

const VISIBILITY_DURATION = 2000

@Directive({
  selector: '[scroll-to-top]',
  host: {
    '[class]': "'scroll-to-top-fab'",
    '[class.visible]': "_visible",
    '(click)': "scrollToTop()",
  }
})
export class ScrollToTopDirective implements OnInit, OnDestroy {

  constructor(private content: Content,
              private zone: NgZone) {
  }

  _visible: boolean = false

  private _scrollSelfInitiated: boolean = false

  private subscription: Subscription = new Subscription()

  ngOnInit(): void {
    let show$ = defer(() => this._setVisible(true))
    let hide$ = defer(() => this._setVisible(false))

    this.subscription.add(
      this.content.ionScroll.pipe(
        filter(e => !this._scrollSelfInitiated || (!!e && e.scrollTop == 0)),
        switchMap((e: ScrollEvent) => {
            if (!!e && e.scrollTop == 0) {
              return hide$
            } else {
              return show$.pipe(delay(VISIBILITY_DURATION), switchMapTo(hide$))
            }
          }
        ),
      ).subscribe()
    )
  }

  _setVisible(visible: boolean): void {
    if (this._visible != visible) {
      this.zone.run(() => {
        this._visible = visible
      })
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe()
  }

  scrollToTop() {
    if (!this._visible) return

    this._scrollSelfInitiated = true
    this.content.scrollToTop().then(() => {
      this._scrollSelfInitiated = false
    })
  }
}
