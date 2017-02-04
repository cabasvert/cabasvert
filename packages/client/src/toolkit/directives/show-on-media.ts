import { Attribute, Directive, ElementRef } from '@angular/core'
import { Platform } from "ionic-angular"

@Directive({ selector: '[showOnMedia]' })
export class ShowOnMediaDirective {

  private resizeObs: any

  constructor(@Attribute('showOnMedia') private media: string,
              private el: ElementRef,
              private plt: Platform) {
    this.checkIfDisplayed()

    this.resizeObs = plt.resize.subscribe(() => this.checkIfDisplayed())
  }

  ngOnDestroy() {
    this.resizeObs && this.resizeObs.unsubscribe()
    this.resizeObs = null
  }

  private checkIfDisplayed() {
    let mediaQuery =
      this.media == 'sm' ? 'screen and (min-width:576px)' :
        this.media == 'md' ? 'screen and (min-width:768px)' :
          this.media == 'lg' ? 'screen and (min-width:992px)' :
            this.media == 'xl' ? 'screen and (min-width:1200px)' :
              this.media

    let matches = window.matchMedia(mediaQuery).matches
    this.el.nativeElement.style.display = matches ? null : 'none'
  }
}
