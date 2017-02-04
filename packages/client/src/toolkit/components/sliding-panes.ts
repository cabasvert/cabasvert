import { AfterContentInit, Component, ContentChildren, Input, QueryList } from "@angular/core"
import { SlidingPane } from "./sliding-pane"

@Component({
  selector: 'sliding-panes',
  template: `
    <div class="sliding-panes-slider"
         [style.width]="_paneCount * 100 + '%'"
         [style.transform]="'translate(-' + (_perNamePaneIndex[selectedPane] * 100 / _paneCount) + '%, 0)'">
      <ng-content select="sliding-pane"></ng-content>
    </div>
  `,
})
export class SlidingPanes implements AfterContentInit {

  @Input() selectedPane: string

  constructor() {
  }

  @ContentChildren(SlidingPane) private _panes: QueryList<SlidingPane>

  ngAfterContentInit(): void {
    this.updatePaneSizes()
  }

  _paneCount: number
  _perNamePaneIndex: { [name: string]: number }

  private updatePaneSizes() {
    this._paneCount = this._panes.length

    this._perNamePaneIndex = {}
    var index = 0
    this._panes.forEach(pane => {
      this._perNamePaneIndex[pane.name] = index++
      pane.setWidth(100 / this._paneCount)
    })
  }
}
