import { IonButton, IonCheckbox, IonItem, IonLabel, IonList } from '@ionic/react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { useAuth } from '../../toolkit/auth'
import { DialogProps, ModalDialog } from '../../toolkit/dialogs'
import {
  IonField, IonFieldLabel, IonForm, IonHelperText, IonPasswordInput, IonTrailingIndicator,
} from '../../toolkit/forms'

interface Props extends DialogProps {
}

interface ChangePasswordData {
  oldPassword: string
  newPassword: string
  confirmedPassword: string
  storePassword?: boolean
}

export const ChangePasswordDialog: React.FC<Props> = ({ ...props }) => {
  const { t } = useTranslation('CHANGE_PASSWORD')
  const { t: tDialogs } = useTranslation('DIALOGS')
  const { hasPasswordStorage, changePassword } = useAuth()

  const methods = useForm<ChangePasswordData>({
    mode: 'onBlur',
    validationSchema: Yup.object({
      oldPassword: Yup.string().required(tDialogs('REQUIRED')),
      newPassword: Yup.string().required(tDialogs('REQUIRED')),
      confirmedPassword: Yup.string().required(tDialogs('REQUIRED'))
        .oneOf([Yup.ref('newPassword'), null], t('PASSWORDS_DO_NOT_MATCH'))
    }),
  })
  const { errors, formState } = methods

  const doChangePassword = async ({oldPassword, newPassword, storePassword}: ChangePasswordData) => {
    await changePassword(oldPassword, newPassword, storePassword || false)
  }

  return (
    <ModalDialog title={t('TITLE')} {...props}>
      <IonForm<ChangePasswordData> onSubmit={doChangePassword} {...methods}>
        <IonList className="ion-margin">

          <IonItem style={{ '--background': 'var(--ion-color-step-100)', '--border-color': 'var(--ion-color-step-300)', '--border-radius': '4px 4px 0 0' }}>
            <IonFieldLabel text={t('OLD_PASSWORD')} position="floating" errors={errors.oldPassword} />
            <IonField name="oldPassword" as={<IonPasswordInput data-testid="oldPassword-input" {/*disabled*/} />} />
            <IonTrailingIndicator errors={errors.oldPassword} />
          </IonItem>
          <IonHelperText errors={errors.oldPassword} />

          <IonItem className="ion-margin-top"
                   style={{ '--background': 'var(--ion-color-step-100)', '--border-radius': '4px 4px 0 0' }}>
            <IonFieldLabel text={t('NEW_PASSWORD')} position="floating" errors={errors.newPassword} />
            <IonField name="newPassword" as={<IonPasswordInput data-testid="newPassword-input" />} />
            <IonTrailingIndicator errors={errors.newPassword} />
          </IonItem>
          <IonHelperText errors={errors.newPassword} />

          <IonItem lines="full" className="ion-margin-top"
                   style={{ '--background': 'var(--ion-color-step-100)', '--border-radius': '4px 4px 0 0' }}>
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
