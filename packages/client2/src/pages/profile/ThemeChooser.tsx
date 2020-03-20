import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Theme, useTheme } from '../../hooks/theme'

export const ThemeChooser: React.FC = () => {
  const { t } = useTranslation('PROFILE')
  const { theme, changeTheme } = useTheme()

  const selectTheme = (t: string | undefined) => changeTheme(t === 'system' ? undefined : t as Theme)

  const themes = ['system', 'dark', 'light']

  return (
    <IonItem>
      <IonLabel>{t('THEME')}</IonLabel>
      <IonSelect value={theme || 'system'} interface="popover" onIonChange={e => selectTheme(e.detail.value)}>
        {themes.map(theme => <IonSelectOption key={theme} value={theme}>{t(`THEME_${theme}`)}</IonSelectOption>)}
      </IonSelect>
    </IonItem>
  )
}
