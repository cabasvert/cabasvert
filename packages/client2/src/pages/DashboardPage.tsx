import { Season } from '@cabasvert/data'
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SynchronizationStateIcon, useDatabase } from '../toolkit/database'
import { useObservable } from '../toolkit/observables'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation('DASHBOARD')
  const { findAll$ } = useDatabase()

  const seasons$ = useMemo(
    () => findAll$({
      selector: {
        type: 'season',
      },
      // use_index: 'type',
    }, doc => new Season(doc), season => season.id),
    [findAll$],
  )
  const [seasons] = useObservable(seasons$)
  console.log(seasons)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{t('TITLE')}</IonTitle>
          <IonButtons slot="primary">
            <SynchronizationStateIcon />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Counter />
        {seasons && seasons.map(s => <p key={s.id}>{s.name}</p>)}
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

