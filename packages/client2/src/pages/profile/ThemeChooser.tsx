import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react'
import React from 'react'
import { Theme, useTheme } from '../../hooks/theme'

export const ThemeChooser: React.FC = () => {
  const { theme, changeTheme } = useTheme()

  const selectTheme = (t: string | undefined) => changeTheme(t === 'system' ? undefined : t as Theme)

  return (
    <IonItem>
      <IonLabel>Theme</IonLabel>
      <IonSelect value={theme || 'system'} interface="popover" okText="Okay" cancelText="Dismiss"
                 onIonChange={e => selectTheme(e.detail.value)}>
        <IonSelectOption value="system">From System Prefs</IonSelectOption>
        <IonSelectOption value="light">Light</IonSelectOption>
        <IonSelectOption value="dark">Dark</IonSelectOption>
      </IonSelect>
    </IonItem>
  )
}
