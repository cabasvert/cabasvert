import { Ion } from "ionic-angular"
import { Observable } from "rxjs/Observable"

export function fromIonic(target: Ion, eventName: string): Observable<Event> {
  return Observable.create(observer => {
    let nativeElement = target._elementRef.nativeElement
    let subscription = target._renderer.listen(nativeElement, eventName,
      (event: Event) => {
        observer.next(event)
        return false
      }
    )

    return () => {
      if (subscription) subscription()
    }
  })
}
