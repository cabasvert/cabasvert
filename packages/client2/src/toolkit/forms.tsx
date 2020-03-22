import { JSX } from '@ionic/core'
import { IonCheckbox, IonIcon, IonInput, IonLabel, IonNote } from '@ionic/react'
import { IonicReactProps } from '@ionic/react/dist/types/components/IonicReactProps'
import React, { HTMLAttributes, PropsWithChildren, useCallback, useMemo, useState } from 'react'
import {
  Controller, EventFunction, FieldError, FieldValues, FormContext, FormContextValues, OnSubmit, useFormContext,
  Validate,
} from 'react-hook-form'
import { FieldName } from 'react-hook-form/dist/types'

interface IonFieldLabelProps {
  text: string
  position?: 'stacked' | 'fixed' | 'floating'
  errors?: FieldError
}

export const IonFieldLabel: React.FC<IonFieldLabelProps> = ({ text, position, errors }) => <>
  <IonLabel color={errors ? 'danger' : 'dark'} position={position}>
    {text}
  </IonLabel>
</>

interface IonTrailingIndicatorProps {
  errors: FieldError | undefined
}

export const IonTrailingIndicator: React.FC<IonTrailingIndicatorProps> = ({ errors }) => <>
  {errors && <IonIcon icon="alert-circle" color="danger" slot="end" className="ion-margin-top" />}
</>

interface IonHelperTextProps {
  defaultText?: string
  errors?: FieldError
}

export const IonHelperText: React.FC<IonHelperTextProps> = ({ defaultText, errors }) => {
  return (
    <IonNote className="ion-padding-start" color={errors ? 'danger' : 'medium'} style={{ fontSize: 11 }}>
      {errors?.message || defaultText || ''}
    </IonNote>
  )
}

interface IonFormProps<FormValues extends FieldValues = FieldValues> extends FormContextValues<FormValues> {
  onSubmit: OnSubmit<FormValues>
}

export function IonForm<FormValues extends FieldValues = FieldValues>({
  onSubmit,
  children,
  ...methods
}: PropsWithChildren<IonFormProps<FormValues>>): React.ReactElement<IonFormProps<FormValues>> {
  const { handleSubmit, getValues } = methods

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormContext {...methods}>
        {children}
      </FormContext>
    </form>
  )
}

type IonPasswordInputProps =
  Omit<JSX.IonInput, 'type'>
  & Pick<HTMLAttributes<HTMLIonItemGroupElement>, 'hidden' | 'dir' | 'slot' | 'title' | 'color' | 'children' | 'className' | 'defaultChecked' | 'defaultValue' | 'suppressContentEditableWarning' | 'suppressHydrationWarning' | 'accessKey' | 'contentEditable' | 'contextMenu' | 'draggable' | 'id' | 'lang' | 'placeholder' | 'spellCheck' | 'tabIndex' | 'translate' | 'radioGroup' | 'role' | 'about' | 'datatype' | 'inlist' | 'prefix' | 'property' | 'resource' | 'typeof' | 'vocab' | 'autoCapitalize' | 'autoCorrect' | 'autoSave' | 'itemProp' | 'itemScope' | 'itemType' | 'itemID' | 'itemRef' | 'results' | 'security' | 'unselectable' | 'inputMode' | 'is' | 'aria-activedescendant' | 'aria-atomic' | 'aria-autocomplete' | 'aria-busy' | 'aria-checked' | 'aria-colcount' | 'aria-colindex' | 'aria-colspan' | 'aria-controls' | 'aria-current' | 'aria-describedby' | 'aria-details' | 'aria-disabled' | 'aria-dropeffect' | 'aria-errormessage' | 'aria-expanded' | 'aria-flowto' | 'aria-grabbed' | 'aria-haspopup' | 'aria-hidden' | 'aria-invalid' | 'aria-keyshortcuts' | 'aria-label' | 'aria-labelledby' | 'aria-level' | 'aria-live' | 'aria-modal' | 'aria-multiline' | 'aria-multiselectable' | 'aria-orientation' | 'aria-owns' | 'aria-placeholder' | 'aria-posinset' | 'aria-pressed' | 'aria-readonly' | 'aria-relevant' | 'aria-required' | 'aria-roledescription' | 'aria-rowcount' | 'aria-rowindex' | 'aria-rowspan' | 'aria-selected' | 'aria-setsize' | 'aria-sort' | 'aria-valuemax' | 'aria-valuemin' | 'aria-valuenow' | 'aria-valuetext' | 'dangerouslySetInnerHTML' | 'onCopy' | 'onCopyCapture' | 'onCut' | 'onCutCapture' | 'onPaste' | 'onPasteCapture' | 'onCompositionEnd' | 'onCompositionEndCapture' | 'onCompositionStart' | 'onCompositionStartCapture' | 'onCompositionUpdate' | 'onCompositionUpdateCapture' | 'onFocus' | 'onFocusCapture' | 'onBlur' | 'onBlurCapture' | 'onChange' | 'onChangeCapture' | 'onBeforeInput' | 'onBeforeInputCapture' | 'onInput' | 'onInputCapture' | 'onReset' | 'onResetCapture' | 'onSubmit' | 'onSubmitCapture' | 'onInvalid' | 'onInvalidCapture' | 'onLoad' | 'onLoadCapture' | 'onError' | 'onErrorCapture' | 'onKeyDown' | 'onKeyDownCapture' | 'onKeyPress' | 'onKeyPressCapture' | 'onKeyUp' | 'onKeyUpCapture' | 'onAbort' | 'onAbortCapture' | 'onCanPlay' | 'onCanPlayCapture' | 'onCanPlayThrough' | 'onCanPlayThroughCapture' | 'onDurationChange' | 'onDurationChangeCapture' | 'onEmptied' | 'onEmptiedCapture' | 'onEncrypted' | 'onEncryptedCapture' | 'onEnded' | 'onEndedCapture' | 'onLoadedData' | 'onLoadedDataCapture' | 'onLoadedMetadata' | 'onLoadedMetadataCapture' | 'onLoadStart' | 'onLoadStartCapture' | 'onPause' | 'onPauseCapture' | 'onPlay' | 'onPlayCapture' | 'onPlaying' | 'onPlayingCapture' | 'onProgress' | 'onProgressCapture' | 'onRateChange' | 'onRateChangeCapture' | 'onSeeked' | 'onSeekedCapture' | 'onSeeking' | 'onSeekingCapture' | 'onStalled' | 'onStalledCapture' | 'onSuspend' | 'onSuspendCapture' | 'onTimeUpdate' | 'onTimeUpdateCapture' | 'onVolumeChange' | 'onVolumeChangeCapture' | 'onWaiting' | 'onWaitingCapture' | 'onAuxClick' | 'onAuxClickCapture' | 'onClick' | 'onClickCapture' | 'onContextMenu' | 'onContextMenuCapture' | 'onDoubleClick' | 'onDoubleClickCapture' | 'onDrag' | 'onDragCapture' | 'onDragEnd' | 'onDragEndCapture' | 'onDragEnter' | 'onDragEnterCapture' | 'onDragExit' | 'onDragExitCapture' | 'onDragLeave' | 'onDragLeaveCapture' | 'onDragOver' | 'onDragOverCapture' | 'onDragStart' | 'onDragStartCapture' | 'onDrop' | 'onDropCapture' | 'onMouseDown' | 'onMouseDownCapture' | 'onMouseEnter' | 'onMouseLeave' | 'onMouseMove' | 'onMouseMoveCapture' | 'onMouseOut' | 'onMouseOutCapture' | 'onMouseOver' | 'onMouseOverCapture' | 'onMouseUp' | 'onMouseUpCapture' | 'onSelect' | 'onSelectCapture' | 'onTouchCancel' | 'onTouchCancelCapture' | 'onTouchEnd' | 'onTouchEndCapture' | 'onTouchMove' | 'onTouchMoveCapture' | 'onTouchStart' | 'onTouchStartCapture' | 'onPointerDown' | 'onPointerDownCapture' | 'onPointerMove' | 'onPointerMoveCapture' | 'onPointerUp' | 'onPointerUpCapture' | 'onPointerCancel' | 'onPointerCancelCapture' | 'onPointerEnter' | 'onPointerEnterCapture' | 'onPointerLeave' | 'onPointerLeaveCapture' | 'onPointerOver' | 'onPointerOverCapture' | 'onPointerOut' | 'onPointerOutCapture' | 'onGotPointerCapture' | 'onGotPointerCaptureCapture' | 'onLostPointerCapture' | 'onLostPointerCaptureCapture' | 'onScroll' | 'onScrollCapture' | 'onWheel' | 'onWheelCapture' | 'onAnimationStart' | 'onAnimationStartCapture' | 'onAnimationEnd' | 'onAnimationEndCapture' | 'onAnimationIteration' | 'onAnimationIterationCapture' | 'onTransitionEnd' | 'onTransitionEndCapture'>
  & IonicReactProps

export const IonPasswordInput: React.FC<IonPasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <>
      <IonInput type={showPassword ? 'text' : 'password'} {...props} />
      <IonIcon icon={showPassword ? 'eye' : 'eye-off'} slot="end" className="ion-margin-top"
               onClick={() => setShowPassword(s => !s)} />
    </>
  )
}

interface IonFieldProps<FormValues extends FieldValues = FieldValues> {
  name: FieldName<FormValues>
  rules?: Partial<{
    required: string | boolean | {
      value: boolean;
      message: string;
    };
    min: string | number | {
      value: React.ReactText;
      message: string;
    };
    max: string | number | {
      value: React.ReactText;
      message: string;
    };
    maxLength: string | number | {
      value: React.ReactText;
      message: string;
    };
    minLength: string | number | {
      value: React.ReactText;
      message: string;
    };
    pattern: RegExp | {
      value: RegExp;
      message: string;
    };
    validate: Validate | Record<string, Validate>;
  }> | undefined;
  as: React.ReactElement
}

export function IonField<FormValues extends FieldValues = FieldValues>({
  name,
  rules,
  as,
}: IonFieldProps<FormValues>): React.ReactElement<IonFormProps<FormValues>> {
  const { control, formState: { dirty } } = useFormContext<FormValues>()

  const onBlur: EventFunction = useCallback(([event]) => event?.target?.value, [])
  const onChange: EventFunction = useCallback(([event]) => event?.detail?.value, [])

  return useMemo(() =>
      <Controller
        as={as} name={name} control={control} rules={rules}
        onBlurName="onIonBlur" onBlur={onBlur}
        onChangeName="onIonChange" onChange={onChange}
      />,
    [dirty],
  )
}
