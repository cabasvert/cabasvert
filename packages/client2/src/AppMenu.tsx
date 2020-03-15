import {
  IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonMenu,
  IonMenuToggle,
  IonToolbar,
} from '@ionic/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/auth'
import { PageDescription, PAGES } from './pages'
import { APP_VERSION } from './version'

export const AppMenu: React.FC = () => {
  const { t } = useTranslation('SIDEMENU')
  const { user, logout } = useAuth()
  const location = useLocation()
  const history = useHistory()

  if (!user) throw new Error('Invalid state')

  const isCurrentLocation = (page: PageDescription): boolean => {
    return location.pathname === `/${page.path}`
  }

  const navigateToPage = async (page: PageDescription) => {
    history.replace(page.path)
  }

  const doLogout = async () => {
    await logout()
    history.replace('/login')
  }

  return (
    <IonMenu contentId="main" swipeGesture>
      <IonHeader>
        <IonToolbar color="primary">
          <IonItem color="inherit" lines="none" slot="start">
            <IonIcon size="large" icon="person" className="ion-margin-end" />
            <IonLabel>
              <p>{user.name}</p>
              <p style={{ fontSize: 'xx-small', lineHeight: '1' }}>{user.email}</p>
            </IonLabel>
          </IonItem>
          <IonButtons slot="end">
            <IonButton slot="icon-only" data-testid="logout-button" onClick={doLogout}>
              <IonIcon icon="log-out" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          {PAGES.filter(g => !g.acceptedRoles || user.hasRole(...g.acceptedRoles)).map((g, i) =>
            <IonItemGroup key={i}>
              {g.title && <IonItemDivider>{t(g.title)}</IonItemDivider>}
              {g.pages.filter(p => !p.acceptedRoles || user.hasRole(...p.acceptedRoles)).map((p, j) =>
                <IonMenuToggle key={j} autoHide={false}>
                  <IonItem lines="none" button data-testid={`menu-${p.path}`}
                           color={isCurrentLocation(p) ? 'primary' : undefined}
                           onClick={() => navigateToPage(p)}>
                    <IonIcon slot="start" icon={p.icon} />
                    <IonLabel>{t(p.title)}</IonLabel>
                  </IonItem>
                </IonMenuToggle>,
              )}
            </IonItemGroup>,
          )}
        </IonList>
      </IonContent>
      <IonFooter>
        <p style={{ fontSize: 'xx-small', lineHeight: '1', paddingLeft: 4 }}>Version {APP_VERSION}</p>
      </IonFooter>
    </IonMenu>
  )
}
