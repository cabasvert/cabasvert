import { AbstractControl } from "@angular/forms"

export class Forms {

  public static forceCastAsNumberOrNull(control: AbstractControl) {
    control.valueChanges.subscribe(value => {
      if (value == null || value.length === 0) return
      control.setValue(+value, { emitEvent: false })
    })
  }
}
