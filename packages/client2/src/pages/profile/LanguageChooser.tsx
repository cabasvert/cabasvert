import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'

export const LanguageChooser: React.FC = () => {
  const { i18n, t } = useTranslation('PROFILE')

  const selectLanguage = async (l: string) => {
    await i18n.changeLanguage(l)
  }

  const language = i18n.language || 'system'
  const languages = ['system', 'en', 'fr']

  return (
    <IonSelect value={language} interface="popover" onIonChange={e => selectLanguage(e.detail.value)}>
      {languages.map(language => <IonSelectOption key={language} value={language}>
        {language === 'system' ? t(`LANGUAGE_${language}`) : i18n.getFixedT(language, 'PROFILE')('LANGUAGE_NAME')}
      </IonSelectOption>)}
    </IonSelect>
  )
}
