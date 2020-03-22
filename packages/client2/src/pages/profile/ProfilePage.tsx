import {
  IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar,
} from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageChooser } from './LanguageChooser'
import { PasswordChangeButton } from './PasswordChangeButton'
import { ThemeChooser } from './ThemeChooser'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation('PROFILE')

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{t('TITLE')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonListHeader><IonLabel>{t('SETTINGS')}</IonLabel></IonListHeader>

          <IonItem>
            <IonLabel>{t('LANGUAGE')}</IonLabel>
            <LanguageChooser />
          </IonItem>

          <IonItem>
            <IonLabel>{t('THEME')}</IonLabel>
            <ThemeChooser />
          </IonItem>

        </IonList>
        <IonList>
          <IonListHeader><IonLabel>{t('SECURITY')}</IonLabel></IonListHeader>

          <IonItem>
            <IonLabel>{t('PASSWORD')}</IonLabel>
            <PasswordChangeButton />
          </IonItem>

        </IonList>
      </IonContent>
    </IonPage>
  )
}
