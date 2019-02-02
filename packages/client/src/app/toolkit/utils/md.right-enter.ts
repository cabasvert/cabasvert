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

import { Animation } from '@ionic/core'

/**
 * Md Popover Enter Animation
 */
export function mdRightEnterAnimation(AnimationC: Animation, baseEl: HTMLElement, ev?: Event): Promise<Animation> {
  let originY = 'top'
  let originX = 'right'

  const contentEl = baseEl.querySelector('.popover-content') as HTMLElement
  const contentDimensions = contentEl.getBoundingClientRect()
  const contentWidth = contentDimensions.width
  const contentHeight = contentDimensions.height

  const bodyWidth = window.innerWidth
  const bodyHeight = window.innerHeight

  // If ev was passed, use that for target element
  const targetDim =
    ev && ev.target && (ev.target as HTMLElement).getBoundingClientRect()

  const targetTop =
    targetDim != null && 'top' in targetDim
      ? targetDim.top
      : bodyHeight / 2 - contentHeight / 2

  const isRTL = document.dir === 'rtl'
  const targetRight =
    targetDim != null && 'left' in targetDim
      ? isRTL
      ? targetDim.left - contentWidth + targetDim.width
      : targetDim.left
      : bodyWidth / 2 - contentWidth / 2

  const targetHeight = (targetDim && targetDim.height) || 0

  const popoverCSS: { top: any; right: any } = {
    top: targetTop,
    right: targetRight,
  }

  // If the popover right is less than the padding it is off screen
  // to the right so adjust it, else if the width of the popover
  // exceeds the body width it is off screen to the left so adjust
  if (popoverCSS.right < POPOVER_MD_BODY_PADDING) {
    popoverCSS.right = POPOVER_MD_BODY_PADDING
  } else if (
    contentWidth + POPOVER_MD_BODY_PADDING + popoverCSS.right >
    bodyWidth
  ) {
    popoverCSS.right = bodyWidth - contentWidth - POPOVER_MD_BODY_PADDING
    originX = 'left'
  }

  // If the popover when popped down stretches past bottom of screen,
  // make it pop up if there's room above
  if (
    targetTop + targetHeight + contentHeight > bodyHeight &&
    targetTop - contentHeight > 0
  ) {
    popoverCSS.top = targetTop - contentHeight
    baseEl.className = baseEl.className + ' popover-bottom'
    originY = 'bottom'
    // If there isn't room for it to pop up above the target cut it off
  } else if (targetTop + targetHeight + contentHeight > bodyHeight) {
    contentEl.style.bottom = POPOVER_MD_BODY_PADDING + 'px'
  }

  contentEl.style.top = popoverCSS.top + 'px'
  contentEl.style.right = popoverCSS.right + 'px'
  contentEl.style.transformOrigin = originY + ' ' + originX

  const baseAnimation = new AnimationC()

  const backdropAnimation = new AnimationC()
  backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'))
  backdropAnimation.fromTo('opacity', 0.01, 0.32)

  const wrapperAnimation = new AnimationC()
  wrapperAnimation.addElement(baseEl.querySelector('.popover-wrapper'))
  wrapperAnimation.fromTo('opacity', 0.01, 1)

  const contentAnimation = new AnimationC()
  contentAnimation.addElement(baseEl.querySelector('.popover-content'))
  contentAnimation.fromTo('scale', 0.001, 1)

  const viewportAnimation = new AnimationC()
  viewportAnimation.addElement(baseEl.querySelector('.popover-viewport'))
  viewportAnimation.fromTo('opacity', 0.01, 1)

  return Promise.resolve(baseAnimation
    .addElement(baseEl)
    .easing('cubic-bezier(0.36,0.66,0.04,1)')
    .duration(300)
    .add(backdropAnimation)
    .add(wrapperAnimation)
    .add(contentAnimation)
    .add(viewportAnimation))
}

const POPOVER_MD_BODY_PADDING = 12
