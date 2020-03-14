import { IonContent, IonHeader, IonItem, IonLabel, IonPage, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar } from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { Theme, useTheme } from '../hooks/theme'

export const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ionic Blank Bim</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Counter/>
        <ThemeChooser/>
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

const ThemeChooser: React.FC = () => {
  const { theme, changeTheme } = useTheme()

  const selectTheme = (t: string | undefined) => changeTheme(t === 'system' ? undefined : t as Theme)

  return (
    <IonItem>
      <IonLabel>Theme</IonLabel>
      <IonSelect value={theme || 'system'} okText="Okay" cancelText="Dismiss" onIonChange={e => selectTheme(e.detail.value)}>
        <IonSelectOption value="system">From System Prefs</IonSelectOption>
        <IonSelectOption value="light">Light</IonSelectOption>
        <IonSelectOption value="dark">Dark</IonSelectOption>
      </IonSelect>
    </IonItem>
  )
}

