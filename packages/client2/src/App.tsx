import {
  IonApp, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList,
  IonMenu, IonRouterOutlet, IonSplitPane, IonToolbar,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, Route, useHistory, useLocation } from 'react-router-dom'
import { Login } from './auth/Login'
import { AuthProvider, useAuth } from './hooks/auth'
import { PageDescription, PAGES } from './pages'
import { Dashboard } from './pages/Dashboard'
import { APP_VERSION } from './version'

export const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <PublicAppContent />
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  )
}

function PublicAppContent() {
  const { isLoggedIn } = useAuth()
  console.log('isLoggedIn', isLoggedIn)

  // @ts-ignore
  return <IonRouterOutlet id="root">
    <Route exact path="/login" component={Login} />
    <Route render={() => isLoggedIn ? <AppContent /> : <Redirect to="/login" />} />
  </IonRouterOutlet>
}

const AppContent: React.FC = () => {
  return (
    <IonContent>
      <IonSplitPane contentId="main">
        <AppMenu />
        <AppRoutes />
      </IonSplitPane>
    </IonContent>
  )
}

const AppMenu: React.FC = () => {
  const { t } = useTranslation('SIDEMENU')
  const { user, logout } = useAuth()
  const location = useLocation()
  const history = useHistory()

  if (!user) throw new Error('Invalid state')

  const isCurrentLocation = (page: PageDescription): boolean => {
    console.log(location.pathname)
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
            <IonIcon size="large" name="person" className="ion-margin-end"/>
            <IonLabel>
              <p>{user.name}</p>
              <p style={{ fontSize: 'xx-small', lineHeight: '1' }}>{user.email}</p>
            </IonLabel>
          </IonItem>
          <IonButtons slot="end">
            <IonButton slot="icon-only" data-testid="logout-button" onClick={doLogout}>
              <IonIcon name="log-out" />
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
                <IonItem key={j} lines="none" button data-testid={`menu-${p.path}`}
                         color={isCurrentLocation(p) ? 'primary' : undefined}
                         onClick={() => navigateToPage(p)}>
                  <IonIcon slot="start" name={p.icon} />
                  <IonLabel>{t(p.title)}</IonLabel>
                </IonItem>,
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

const AppRoutes: React.FC = () => {
  // @ts-ignore
  return <IonRouterOutlet id="main">
    <Route exact path="/dashboard" component={Dashboard} />
    <Route exact path="/" render={() => <Redirect to="/dashboard" />} />

    <Redirect to="/dashboard" />
  </IonRouterOutlet>
}
