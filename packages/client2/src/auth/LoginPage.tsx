import {
  IonButton, IonCheckbox, IonCol, IonContent, IonGrid, IonInput, IonItem, IonLabel, IonList, IonPage, IonRow,
} from '@ionic/react'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import * as Yup from 'yup'
import { useAuth } from '../toolkit/auth'
import { useFeedback } from '../toolkit/feedback'
import { IonField, IonFieldLabel, IonForm, IonPasswordInput } from '../toolkit/forms'
import { useLog } from '../toolkit/log'

interface LoginData {
  email: string
  password: string
  storePassword?: boolean
}

export const LoginPage: React.FC = () => {
  const { t } = useTranslation('LOGIN')
  const log = useLog()
  const { showToast, showLoading, dismissLoading } = useFeedback()
  const { hasPasswordStorage, login } = useAuth()
  const history = useHistory()

  const methods = useForm<LoginData>({
    mode: 'onChange',
    validationSchema: Yup.object({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    }),
  })
  const { errors, formState, register } = methods

  const forgotPassword = () => {
  }

  const doLogin = useCallback(
    async ({ email, password, storePassword }: LoginData) => {
      showLoading(t('LOGGING_IN'))
      try {
        await login(email, password, storePassword || false)
        history.replace(`/`)
        dismissLoading()
      } catch (e) {
        log.error('Failed to log in:', e)
        dismissLoading()
        showToast({ message: t('ACCESS_DENIED'), color: 'danger' })
      }
    },
    [login, history],
  )

  return (
    <IonPage>
      <IonContent>
        <IonGrid style={{ height: '100%' }}>
          <IonRow style={{ height: '100%' }} className="ion-align-items-center">
            <IonCol>
              <IonRow className="ion-justify-content-center">
                <IonCol className="ion-text-center">
                  <img width="128" height="128" src="../assets/img/icon.svg" alt="Logo Cabas Vert" />
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol sizeLg="6" sizeMd="8" sizeSm="10" sizeXs="12">

                  <IonForm<LoginData> onSubmit={doLogin} {...methods}>
                    <IonList className="ion-margin field-set">

                      <IonItem>
                        <IonFieldLabel text={t('USERNAME')} position="floating" errors={errors.email} />
                        <IonField name="email"
                                  as={<IonInput type="email" autocomplete="on" data-testid="email-input" />} />
                      </IonItem>

                      <IonItem className="ion-margin-top">
                        <IonFieldLabel text={t('PASSWORD')} position="floating" errors={errors.password} />
                        <IonField name="password"
                                  as={<IonPasswordInput autocomplete="on" data-testid="password-input" />} />
                      </IonItem>

                      {hasPasswordStorage && <IonItem>
                        <IonLabel>{t('STORE_PASSWORD')}</IonLabel>
                        <IonField name="storePassword" as={<IonCheckbox />} />
                      </IonItem>}

                    </IonList>

                    <IonButton className="ion-margin" expand="block" type="submit" data-testid="login-button"
                               disabled={!formState.isValid}>
                      {t('LOGIN')}
                    </IonButton>
                    <IonButton className="ion-margin" expand="block" fill="clear" data-testid="forgot-password-button"
                               onClick={forgotPassword}>
                      {t('FORGOT_PASSWORD')}
                    </IonButton>
                  </IonForm>

                </IonCol>
              </IonRow>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  )
}
