import {
  IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonPage, IonSplitPane, IonText, IonTitle, IonToolbar,
} from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeChooser } from './profile/ThemeChooser'

export const Dashboard: React.FC = () => {
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
        <Counter />
        <ThemeChooser />
      </IonContent>
    </IonPage>
  )
}

const Counter: React.FC = () => {
  const [counter, setCounter] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(c => c + 1)
    }, 1000)
    return () => clearInterval(interval)
  })
  return <IonText color={counter % 2 === 0 ? 'danger' : undefined}>{counter}</IonText>
}
