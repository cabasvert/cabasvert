import { IonApp, IonContent, IonRouterOutlet, IonSplitPane } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import { AppMenu } from './AppMenu'
import { LoginPage } from './auth/LoginPage'
import { AuthProvider, useAuth } from './toolkit/auth'
import { DatabaseProvider } from './toolkit/database'
import { FeedbackProvider } from './toolkit/feedback'
import { ThemeProvider } from './toolkit/theme'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/profile/ProfilePage'

export const App: React.FC = () => {
  return (
    <IonApp>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <IonReactRouter>
              <PublicAppRoutes />
            </IonReactRouter>
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </IonApp>
  )
}

const PublicAppRoutes: React.FC = () => {
  const { isLoggedIn } = useAuth()

  // @ts-ignore
  return <IonRouterOutlet id="root">
    <Route exact path="/login" component={LoginPage} />
    <Route render={() => isLoggedIn ? <AppContent /> : <Redirect to="/login" />} />
  </IonRouterOutlet>
}

const AppContent: React.FC = () => {
  return (
    <DatabaseProvider>
      <IonContent>
        <IonSplitPane contentId="main">
          <AppMenu />
          <AppRoutes />
        </IonSplitPane>
      </IonContent>
    </DatabaseProvider>
  )
}

const AppRoutes: React.FC = () => {
  // @ts-ignore
  return <IonRouterOutlet id="main">
    <Route exact path="/dashboard" component={DashboardPage} />
    <Route exact path="/profile" component={ProfilePage} />
    <Route exact path="/" render={() => <Redirect to="/dashboard" />} />

    <Redirect to="/dashboard" />
  </IonRouterOutlet>
}
