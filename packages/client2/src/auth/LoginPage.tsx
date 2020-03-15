import {
  IonButton, IonCheckbox, IonCol, IonContent, IonGrid, IonInput, IonItem, IonLabel, IonList, IonLoading, IonRow, IonToast,
} from '@ionic/react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, useHistory } from 'react-router'
import { useAuth } from '../hooks/auth'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation('LOGIN')
  const { login } = useAuth()
  const history = useHistory()

  const [userName, setUsername] = useState<string | null | undefined>(undefined)
  const [password, setPassword] = useState<string | null | undefined>(undefined)
  const [storePassword, setStorePassword] = useState<boolean>(false)

  const [loadingText, setLoadingText] = useState<string | undefined>(undefined)
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined)

  const hasPasswordStorage = true
  const canLogin = !!userName && !!password

  const forgotPassword = () => {
  }

  const doLogin = async () => {
    if (!userName || !password) return
    setLoadingText(t('LOGGING_IN'))
    try {
      await login(userName, password, storePassword)
      setLoadingText(undefined)
      history.replace(`/`)
    } catch (e) {
      setToastMessage(t('ACCESS_DENIED'))
    }
  }

  return <IonContent>
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
              <IonList className="ion-margin-bottom">
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
              <IonButton expand="block" type="submit" data-testid="login-button" disabled={!canLogin} onClick={doLogin}>
                {t('LOGIN')}
              </IonButton>
              <IonButton expand="block" fill="clear" data-testid="forgot-password-button" onClick={forgotPassword}>
                {t('FORGOT_PASSWORD')}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonCol>
      </IonRow>
    </IonGrid>
    {/*<IonLoading isOpen={!!loadingText} message={loadingText} />*/}
    {/*<IonToast isOpen={!!toastMessage} message={toastMessage} duration={5000} />*/}
  </IonContent>
}