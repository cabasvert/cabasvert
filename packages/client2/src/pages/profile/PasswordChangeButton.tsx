import { IonButton } from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogControl } from '../../toolkit/dialogs'
import { ChangePasswordDialog } from '../auth/ChangePasswordDialog'

export const PasswordChangeButton: React.FC = () => {
  const { t } = useTranslation('PROFILE')
  const dialogControl = useDialogControl()

  return (
    <>
      <IonButton slot="end" fill="outline" data-testid="change-password-button" onClick={() => dialogControl.show()}>
        {t('CHANGE_PASSWORD')}
      </IonButton>
      <ChangePasswordDialog {...dialogControl} />
    </>
  )
}
