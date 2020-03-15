import {
  IonButton, IonCheckbox, IonCol, IonContent, IonGrid, IonInput, IonItem, IonLabel, IonList, IonLoading, IonPage, IonRow, IonToast,
} from '@ionic/react'
import React, { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router'
import { useAuth } from '../hooks/auth'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation('LOGIN')
  const { hasPasswordStorage, login } = useAuth()
  const history = useHistory()

  const [userName, setUsername] = useState<string | null | undefined>(undefined)
  const [password, setPassword] = useState<string | null | undefined>(undefined)
  const [storePassword, setStorePassword] = useState<boolean>(false)

  const [loadingText, setLoadingText] = useState<string | undefined>(undefined)
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined)

  const canLogin = !!userName && !!password

  const forgotPassword = () => {
  }

  const doLogin = async (event: FormEvent) => {
    event.preventDefault()

    if (!userName || !password) return
    setLoadingText(t('LOGGING_IN'))
    try {
      await login(userName, password, storePassword)
      setLoadingText(undefined)
      history.replace(`/`)
    } catch (e) {
      setLoadingText(undefined)
      setToastMessage(t('ACCESS_DENIED'))
    }
  }

  return (
    <IonPage>
      <IonContent>
        <IonGrid style={{ height: '100%' }}>
          <IonRow style={{ height: '100%' }} className="ion-align-items-center">
            <IonCol>
              <IonRow className="ion-justify-content-center">
                <IonCol className="ion-text-center">
                  <img width="128" height="128" src="./assets/img/icon.svg" alt="Logo Cabas Vert" />
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol sizeLg="6" sizeMd="8" sizeSm="10" sizeXs="12">
                  <form data-testid="login-form" onSubmit={doLogin}>
                    <IonList>
                      <IonItem>
                        <IonLabel color="primary" position="stacked">{t('USERNAME')}</IonLabel>
                        <IonInput type="email" autocomplete="on" data-testid="email-input"
                                  value={userName} onIonChange={e => setUsername(e.detail.value)} />
                      </IonItem>
                      <IonItem>
                        <IonLabel color="primary" position="stacked">{t('PASSWORD')}</IonLabel>
                        <IonInput type="password" autocomplete="on" data-testid="password-input"
                                  value={password} onIonChange={e => setPassword(e.detail.value)} />
                      </IonItem>
                      {hasPasswordStorage && <IonItem>
                        <IonLabel>{t('STORE_PASSWORD')}</IonLabel>
                        <IonCheckbox name="storePassword"
                                     checked={storePassword} onIonChange={e => setStorePassword(e.detail.value)} />
                      </IonItem>}
                    </IonList>
                    <IonButton className="ion-margin-top" expand="block" type="submit" data-testid="login-button"
                               disabled={!canLogin}>
                      {t('LOGIN')}
                    </IonButton>
                    <IonButton className="ion-margin-top" expand="block" fill="clear" data-testid="forgot-password-button"
                               onClick={forgotPassword}>
                      {t('FORGOT_PASSWORD')}
                    </IonButton>
                  </form>
                </IonCol>
              </IonRow>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonLoading isOpen={!!loadingText} message={loadingText} />
        <IonToast isOpen={!!toastMessage} message={toastMessage} duration={5000} />
      </IonContent>
    </IonPage>
  )
}