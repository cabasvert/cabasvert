import { IonButton, IonCheckbox, IonItem, IonLabel, IonList } from '@ionic/react'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { useAuth } from '../../toolkit/auth'
import { DialogProps, ModalDialog } from '../../toolkit/dialogs'
import { useFeedback } from '../../toolkit/feedback'
import {
  IonField, IonFieldLabel, IonForm, IonHelperText, IonPasswordInput, IonTrailingIndicator,
} from '../../toolkit/forms'
import { useLog } from '../../toolkit/log'

interface Props extends DialogProps {
}

interface ChangePasswordData {
  oldPassword: string
  newPassword: string
  confirmedPassword: string
  storePassword?: boolean
}

export const ChangePasswordDialog: React.FC<Props> = (props) => {
  const { onDismiss } = props
  const { t } = useTranslation('CHANGE_PASSWORD')
  const { t: tDialogs } = useTranslation('DIALOGS')
  const log = useLog()
  const { showToast, showLoading, dismissLoading } = useFeedback()
  const { hasPasswordStorage, changePassword } = useAuth()

  const methods = useForm<ChangePasswordData>({
    mode: 'onBlur',
    validationSchema: Yup.object({
      oldPassword: Yup.string().required(tDialogs('REQUIRED')),
      newPassword: Yup.string().required(tDialogs('REQUIRED')),
      confirmedPassword: Yup.string().required(tDialogs('REQUIRED'))
        .oneOf([Yup.ref('newPassword'), null], t('PASSWORDS_DO_NOT_MATCH')),
    }),
  })
  const { errors, formState } = methods

  const doChangePassword = useCallback(
    async ({ oldPassword, newPassword, storePassword }: ChangePasswordData) => {
      showLoading(t('CHANGING_PASSWORD'))
      try {
        await changePassword(oldPassword, newPassword, storePassword || false)
        onDismiss()
        dismissLoading()
        showToast({ message: t('PASSWORD_CHANGED'), color: 'success' })
      } catch (e) {
        log.error('Failed to change password:', e)
        dismissLoading()
        showToast({ header: t('CHANGE_PASSWORD_FAILED'), message: e.message, color: 'danger' })
      }
    },
    [changePassword, onDismiss],
  )

  return (
    <ModalDialog title={t('TITLE')} {...props}>

      <IonForm<ChangePasswordData> onSubmit={doChangePassword} {...methods}>
        <IonList className="ion-margin field-set">

          <IonItem>
            <IonFieldLabel text={t('OLD_PASSWORD')} position="floating" errors={errors.oldPassword} />
            <IonField name="oldPassword" as={<IonPasswordInput data-testid="oldPassword-input" />} />
            <IonTrailingIndicator errors={errors.oldPassword} />
          </IonItem>
          <IonHelperText errors={errors.oldPassword} />

          <IonItem className="ion-margin-top">
            <IonFieldLabel text={t('NEW_PASSWORD')} position="floating" errors={errors.newPassword} />
            <IonField name="newPassword" as={<IonPasswordInput data-testid="newPassword-input" />} />
            <IonTrailingIndicator errors={errors.newPassword} />
          </IonItem>
          <IonHelperText errors={errors.newPassword} />

          <IonItem lines="full" className="ion-margin-top">
            <IonFieldLabel text={t('CONFIRMED_PASSWORD')} position="floating" errors={errors.confirmedPassword} />
            <IonField name="confirmedPassword" as={<IonPasswordInput data-testid="confirmedPassword-input" />} />
            <IonTrailingIndicator errors={errors.confirmedPassword} />
          </IonItem>
          <IonHelperText errors={errors.confirmedPassword} />

          {hasPasswordStorage && <IonItem>
            <IonLabel>{t('STORE_PASSWORD')}</IonLabel>
            <IonField name="storePassword" as={<IonCheckbox />} />
          </IonItem>}

        </IonList>

        <IonButton expand="block" className="ion-margin" type="submit" disabled={!formState.isValid}
                   data-testid="change-password-button">
          {t('CHANGE_PASSWORD')}
        </IonButton>
      </IonForm>
    </ModalDialog>
  )
}
