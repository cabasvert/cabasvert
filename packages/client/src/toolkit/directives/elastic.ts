import { Directive, OnDestroy, OnInit } from '@angular/core'
import { Content, ViewController } from "ionic-angular"
import { Subscription } from "rxjs/Subscription"

@Directive({
  selector: '[elastic]',
  host: {
    '[class]': "'elastic-textarea'",
    '[style.height]': "_height + 'px'"
  }
})
export class ElasticDirective implements OnInit, OnDestroy {

  constructor(private viewCtrl: ViewController,
              private content: Content) {
  }

  _height: number

  _subscription = new Subscription()

  ngOnInit() {
    this._subscription.add(
      this.viewCtrl.willEnter
        .subscribe(() => {
          this._height = this.content.getContentDimensions().contentHeight
        })
    )
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe()
  }
}
