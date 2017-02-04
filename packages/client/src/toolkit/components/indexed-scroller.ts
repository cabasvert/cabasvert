import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
} from "@angular/core"
import { Content, Gesture, ViewController } from "ionic-angular"
import { Observable } from "rxjs/Observable"
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  startWith,
  tap,
} from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { Subscription } from "rxjs/Subscription"
import { observeInsideAngular } from "../../utils/observables"

declare const Hammer: any

const MARGIN = 15
const RIGHT_MARGIN = 10
const PADDING = 5
const BORDER = .5
const FAB_RADIUS = 72 / 2
const BAR_HALF_HEIGHT = 20
const FONT_LINE_HEIGHT = 17

@Component({
  selector: 'indexed-scroller',
  templateUrl: './indexed-scroller.html',
})
export class IndexedScroller implements OnInit, OnDestroy {

  @Input() indexesLabels: string[]

  shortenIndexesLabels: string[]

  scrollToIndex$: Observable<number>
  scrollToLabel$: Observable<string>
  scrolling$: Observable<boolean>

  constructor(@Optional() private content: Content,
              @Optional() private viewCtrl: ViewController,
              private zone: NgZone,
              private elementRef: ElementRef) {
  }

  private _subscription: Subscription = new Subscription()
  private _gesture: Gesture
  private _gestureEvent$: Subject<{ x: number, y: number, scrolling: boolean, immediate?: boolean }> = new Subject()

  _data$: Observable<{ scrolling: boolean, immediate?: boolean, index: number, fabTop: number, barTop: number }>

  ngOnInit(): void {
    this._subscription.add(
      this.viewCtrl.didEnter
        .subscribe(() => {
          this._viewIsActive = true
          this._updateAspect()
        })
    )

    this._subscription.add(
      this.viewCtrl.willLeave
        .subscribe(() => {
          this._viewIsActive = false
        })
    )

    this._gesture = new Gesture(this.elementRef.nativeElement, {
      recognizers: [
        [Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }],
        [Hammer.Press],
        [Hammer.Tap]
      ]
    })
    this._gesture.listen()
    this._gesture.on('pan', e => {
      this._gestureEvent$.next({
        x: e.center.x,
        y: e.center.y,
        scrolling: !e.isFinal,
        immediate: false
      })
    })
    this._gesture.on('press', e => {
      this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: true, immediate: false })
    })
    this._gesture.on('pressup', e => {
      this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: false, immediate: false })
    })
    this._gesture.on('tap', e => {
      this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: false, immediate: true })
    })

    let scrolling$ = this._gestureEvent$.pipe(
      map(e => e.scrolling),
      startWith(false),
      distinctUntilChanged(),
    )

    this._data$ = this._gestureEvent$.pipe(
      tap(_ => this._captureDimensions()),
      filter(e =>
        (e.x >= this._rect.left && e.x <= this._rect.right + RIGHT_MARGIN &&
          e.y >= this._rect.top && e.y <= this._rect.bottom)
      ),
      combineLatest(scrolling$, (e, scrolling) => {
        let { y, immediate, ..._ } = e

        let percent = (y - (this._rect.top + PADDING + MARGIN + BORDER)) / (this._rect.height - 2 * PADDING)
        if (percent < 0) percent = 0
        else if (percent > 1) percent = 1

        let index = Math.floor(this.indexesLabels.length * percent)
        if (index == this.indexesLabels.length) index -= 1

        let fabTop = y - (this._rect.top + MARGIN + FAB_RADIUS)
        let fabBound = this._height - 2 * FAB_RADIUS
        if (fabTop < 0) fabTop = 0
        else if (fabTop > fabBound) fabTop = fabBound
        fabTop += MARGIN

        let barTop = y - (this._rect.top + MARGIN + BORDER + BAR_HALF_HEIGHT)
        let barBound = this._height - 2 * (BORDER + BAR_HALF_HEIGHT)
        if (barTop < 0) barTop = 0
        else if (barTop > barBound) barTop = barBound
        barTop += MARGIN + BORDER

        return { scrolling, immediate, index, fabTop, barTop }
      }),
      observeInsideAngular(this.zone),
      publishReplay(1),
      refCount(),
    )

    this.scrolling$ = this._data$.pipe(
      distinctUntilChanged((d1, d2) => d1.scrolling === d2.scrolling || d1.immediate || d2.immediate),
      map(d => d.scrolling),
      publishReplay(1),
      refCount(),
    )

    this.scrollToIndex$ = this._data$.pipe(
      distinctUntilChanged((d1, d2) => d1.index === d2.index && !(d1.immediate || d2.immediate)),
      map(d => d.index),
      publishReplay(1),
      refCount(),
    )

    this.scrollToLabel$ = this.scrollToIndex$.pipe(
      map(i => this.indexesLabels[i])
    )
  }

  ngOnDestroy() {
    if (this._gesture) this._gesture.destroy()
    if (this._subscription) this._subscription.unsubscribe()
  }

  @HostListener('window:resize')
  resize() {
    if (this._viewIsActive) this._updateAspect()
  }

  @HostBinding('style.height')
  get height() {
    return this._height + 'px'
  }

  private _height: number

  private _viewIsActive: boolean

  private _dirty: boolean = true
  private _rect: ClientRect

  private _updateAspect() {
    // Account for 5px top and 5px bottom margins
    let height = this.content.getContentDimensions().contentHeight - MARGIN * 2

    // Approximate number of lines for a line-height of 17px with 5px top and 5px bottom padding
    let lines = (height - MARGIN * 2) / FONT_LINE_HEIGHT

    // Compute a list of indexes that fit the current height

    let indexesCount = this.indexesLabels.length
    let indexesJump = 1
    while (lines < indexesCount) {
      indexesCount = indexesCount / 2
      indexesJump = indexesJump * 2
    }
    if (indexesJump != 1) indexesJump = indexesJump * 2

    let shortenIndexesLabels = []
    for (let i = 0; i < this.indexesLabels.length; i += indexesJump) {
      shortenIndexesLabels.push(this.indexesLabels[i])
      if (indexesJump != 1)
        shortenIndexesLabels.push("∙")
    }

    this.zone.run(() => {
      this.shortenIndexesLabels = shortenIndexesLabels
      this._height = height
      this._dirty = true
    })
  }

  private _captureDimensions() {
    if (this._dirty) {
      let element = this.elementRef.nativeElement

      this._rect = element.getBoundingClientRect()
      this._dirty = false
    }
  }
}
