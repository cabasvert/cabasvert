import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react'
import React, { useState } from 'react'

export interface DialogProps {
  isOpen: boolean
  onDismiss: () => void
}

interface ModalDialogProps extends DialogProps {
  title: string
}

export const ModalDialog: React.FC<ModalDialogProps> = ({ title, isOpen, onDismiss, children }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton slot="icon-only" onClick={onDismiss}>
              <IonIcon icon="close" />
            </IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>{children}</IonContent>
    </IonModal>
  )
}

interface DialogControl extends DialogProps {
  show: () => void
}

export function useDialogControl(): DialogControl {
  const [isOpen, setOpen] = useState(false)
  const show = () => setOpen(true)
  const onDismiss = () => setOpen(false)

  return { show, isOpen, onDismiss }
}
