import { Component, Input } from "@angular/core"

@Component({
  selector: 'sliding-pane',
  template: `
    <ng-content></ng-content>
  `,
  host: {
    '[style.width]': "_width + '%'",
  },
})
export class SlidingPane {

  @Input() name: string

  _width: number

  setWidth(width: number) {
    this._width = width
  }
}
