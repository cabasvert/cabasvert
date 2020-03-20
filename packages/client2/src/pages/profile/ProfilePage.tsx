import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageChooser } from './LanguageChooser'
import { ThemeChooser } from './ThemeChooser'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation('DASHBOARD')

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
        <LanguageChooser />
        <ThemeChooser />
      </IonContent>
    </IonPage>
  )
}
