/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer,
  ViewChild,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Config, Platform, ViewController } from '@ionic/angular';
import { BaseInput } from '@ionic/angular/util/base-input';
import { TimeoutDebouncer } from '@ionic/angular/util/debouncer';
import { Subscription } from 'rxjs';

const EXPANDED_MARGIN = 6;

@Component({
  selector: 'searchbar-expanding',
  template: `
    <div class="searchbar-expanding-input-container" [style.width]="_width + 'px'">
      <ion-button fill="clear" icon-only color="dark" class="searchbar-expanding-button disable-hover" type="button"
                  (click)="toggleSearchbar($event)" (mousedown)="toggleSearchbar($event)">
        <ion-icon #searchbarIcon name="search"></ion-icon>
      </ion-button>
      <input #searchbarInput class="searchbar-expanding-input"
             (input)="inputChanged($event)"
             (blur)="inputBlurred()"
             (focus)="inputFocused()"
             dir="auto"
             [attr.placeholder]="placeholder"
             [attr.type]="type"
             [attr.autocomplete]="_autocomplete"
             [attr.autocorrect]="_autocorrect"
             [attr.spellcheck]="_spellcheck">
      <ion-button fill="clear" class="searchbar-clear-icon" [mode]="_mode" type="button"
                  (click)="clearInput($event)" (mousedown)="clearInput($event)">
      </ion-button>
    </div>
  `,
  host: {
    '[class.searchbar-has-value]': '_value',
    '[class.searchbar-active]': '_isActive',
    '[class.searchbar-left-aligned]': '_shouldAlignLeft',
    '[class.searchbar-has-focus]': '_isFocus',
  },
  // encapsulation: ViewEncapsulation.None,
})
export class SearchbarExpanding extends BaseInput<string> implements OnInit, OnDestroy {

  _width: number;
  _shouldBlur = true;
  _shouldAlignLeft = true;
  _isCancelVisible = false;
  _spellcheck = false;
  _autocomplete = 'off';
  _autocorrect = 'off';
  _isActive = false;
  _inputDebouncer: TimeoutDebouncer = new TimeoutDebouncer(0);

  /!**
   * @input {number} How long, in milliseconds, to wait to trigger the `ionInput` event after each keystroke. Default `250`.
   *!/
  @Input()
  get debounce(): number {
    return this._debouncer.wait;
  }

  set debounce(val: number) {
    this._debouncer.wait = val;
    this._inputDebouncer.wait = val;
  }

  /!**
   * @input {string} Set the input's placeholder. Default `"Search"`.
   *!/
  @Input() placeholder = 'Search';

  /!**
   * @input {string} Set the input's autocomplete property. Values: `"on"`, `"off"`. Default `"off"`.
   *!/
  @Input()
  set autocomplete(val: string) {
    this._autocomplete = (val === '' || val === 'on') ? 'on' : this._config.get('autocomplete', 'off');
  }

  /!**
   * @input {string} Set the input's autocorrect property. Values: `"on"`, `"off"`. Default `"off"`.
   *!/
  @Input()
  set autocorrect(val: string) {
    this._autocorrect = (val === '' || val === 'on') ? 'on' : this._config.get('autocorrect', 'off');
  }

  /!**
   * @input {string|boolean} Set the input's spellcheck property. Values: `true`, `false`. Default `false`.
   *!/
  @Input()
  set spellcheck(val: string | boolean) {
    this._spellcheck = (val === '' || val === 'true' || val === true) ? true : this._config.getBoolean('spellcheck', false);
  }

  /!**
   * @input {string} Set the type of the input. Values: `"text"`, `"password"`, `"email"`, `"number"`, `"search"`, `"tel"`, `"url"`. Default `"search"`.
   *!/
  @Input() type = 'search';

  /!**
   * @output {event} Emitted when the Searchbar input has changed, including when it's cleared.
   *!/
  @Output() ionInput: EventEmitter<UIEvent> = new EventEmitter<UIEvent>();

  /!**
   * @output {event} Emitted when the cancel button is clicked.
   *!/
  @Output() ionCancel: EventEmitter<UIEvent> = new EventEmitter<UIEvent>();

  /!**
   * @output {event} Emitted when the clear input button is clicked.
   *!/
  @Output() ionClear: EventEmitter<UIEvent> = new EventEmitter<UIEvent>();


  constructor(config: Config,
              private _plt: Platform,
              elementRef: ElementRef,
              renderer: Renderer,
              @Optional() ngControl: NgControl,
              private zone: NgZone,
              @Optional() private viewCtrl: ViewController) {
    super(config, elementRef, renderer, 'searchbar', '', null, null, ngControl);
    this.debounce = 250;
  }

  @ViewChild('searchbarInput') _searchbarInput: ElementRef;

  @ViewChild('searchbarIcon') _searchbarIcon: ElementRef;

  @ViewChild('cancelButton', { read: ElementRef }) _cancelButton: ElementRef;

  private _subscription: Subscription = new Subscription();
  private _viewIsActive = true;

  ngOnInit(): void {
    this._subscription.add(
      this.viewCtrl.didEnter
        .subscribe(() => {
          this._viewIsActive = true;
          this._updateAspect();
        }),
    );

    this._subscription.add(
      this.viewCtrl.willLeave
        .subscribe(() => {
          this._viewIsActive = false;
        }),
    );
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  _windowResize() {
    if (this._viewIsActive) {
      this._updateAspect();
    }
  }

  private _updateAspect() {
    this.zone.run(() => {
      this._width = window.innerWidth - EXPANDED_MARGIN * 2;
    });
  }

  /!**
   * @hidden
   *!/
  _inputUpdated() {
    const ele = this._searchbarInput.nativeElement;
    const value = this._value;
    // It is important not to re-assign the value if it is the same, because,
    // otherwise, the caret is moved to the end of the input
    if (ele.value !== value) {
      ele.value = value;
    }
    this.positionElements();
  }

  /!**
   * @hidden
   * Positions the input search icon, placeholder, and the cancel button
   * based on the input value and if it is focused. (ios only)
   *!/
  positionElements() {
    const prevAlignLeft = this._shouldAlignLeft;
    const shouldAlignLeft = ((this._value && this._value.toString().trim() !== '') || this._isFocus === true);
    this._shouldAlignLeft = shouldAlignLeft;

    if (this._mode !== 'ios') {
      return;
    }

    if (prevAlignLeft !== shouldAlignLeft) {
      this.positionPlaceholder();
    }
  }

  positionPlaceholder() {
    const inputEle = this._searchbarInput.nativeElement;
    const iconEle = this._searchbarIcon.nativeElement;

    if (this._shouldAlignLeft) {
      inputEle.removeAttribute('style');
      iconEle.removeAttribute('style');

    } else {
      // Create a dummy span to get the placeholder width
      const doc = this._plt.doc();
      const tempSpan = doc.createElement('span');
      tempSpan.innerHTML = this.placeholder;
      doc.body.appendChild(tempSpan);

      // Get the width of the span then remove it
      const textWidth = tempSpan.offsetWidth;
      doc.body.removeChild(tempSpan);

      // Set the input padding start
      const inputLeft = 'calc(50% - ' + (textWidth / 2) + 'px)';
      if (this._plt.isRTL) {
        inputEle.style.paddingRight = inputLeft;
      } else {
        inputEle.style.paddingLeft = inputLeft;
      }

      // Set the icon margin start
      const iconLeft = 'calc(50% - ' + ((textWidth / 2) + 30) + 'px)';
      if (this._plt.isRTL) {
        iconEle.style.marginRight = iconLeft;
      } else {
        iconEle.style.marginLeft = iconLeft;
      }
    }
  }

  /!**
   * @hidden
   * Update the Searchbar input value when the input changes
   *!/
  inputChanged(ev: any) {
    this.value = ev.target.value;
    this._inputDebouncer.debounce(() => {
      this.ionInput.emit(ev);
    });
  }

  /!**
   * @hidden
   * Sets the Searchbar to focused and active on input focus.
   *!/
  inputFocused() {
    this._isActive = true;
    this._fireFocus();
    this.positionElements();
  }

  /!**
   * @hidden
   * Sets the Searchbar to not focused and checks if it should align left
   * based on whether there is a value in the searchbar or not.
   *!/
  inputBlurred() {
    // _shouldBlur determines if it should blur
    // if we are clearing the input we still want to stay focused in the input
    if (this._shouldBlur === false) {
      this._searchbarInput.nativeElement.focus();
      this._shouldBlur = true;
      return;
    }
    this._fireBlur();
    this.positionElements();
  }

  /!**
   * @hidden
   * Clears the input field and triggers the control change.
   *!/
  clearInput(ev: UIEvent) {
    this.ionClear.emit(ev);

    // setTimeout() fixes https://github.com/ionic-team/ionic/issues/7527
    // wait for 4 frames
    setTimeout(() => {
      const value = this._value;
      if (value && value !== '') {
        this.value = ''; // DOM WRITE
        this.ionInput.emit(ev);
      }
    }, 16 * 4);
    this._shouldBlur = false;
    this.setFocus();
  }

  /!**
   * @hidden
   * Clears the input field and tells the input to blur since
   * the clearInput function doesn't want the input to blur
   * then calls the custom cancel function if the user passed one in.
   *!/
  toggleSearchbar(ev: UIEvent) {
    if (this._isActive) {
      this.ionCancel.emit(ev);

      this.clearInput(ev);
      this._shouldBlur = true;
      this._isActive = false;
    } else {
      this._isActive = true;
    }
  }

  setFocus() {
    this._renderer.invokeElementMethod(this._searchbarInput.nativeElement, 'focus');
  }
}
*/