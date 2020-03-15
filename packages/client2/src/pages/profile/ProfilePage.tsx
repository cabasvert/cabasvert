import {
  IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonPage, IonSplitPane, IonText, IonTitle, IonToolbar,
} from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
        <ThemeChooser />
      </IonContent>
    </IonPage>
  )
}
