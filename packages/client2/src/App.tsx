import {
  IonApp, IonContent, IonHeader, IonItem, IonList, IonMenu, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'

export const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <IonContent>
          <IonSplitPane contentId="main">
            <IonMenu contentId="main">
              <IonHeader>
                <IonToolbar color="primary">
                  <IonTitle>Menu</IonTitle>
                </IonToolbar>
              </IonHeader>
              <IonContent>
                <IonList>
                  <IonItem>Menu Item</IonItem>
                  <IonItem>Menu Item</IonItem>
                  <IonItem>Menu Item</IonItem>
                  <IonItem>Menu Item</IonItem>
                  <IonItem>Menu Item</IonItem>
                </IonList>
              </IonContent>
            </IonMenu>

            <IonRouterOutlet id="main">
              <Route path="/dashboard" component={Dashboard} exact={true}/>
              <Route exact path="/" render={() => <Redirect to="/dashboard"/>}/>

              <Redirect to="/dashboard"/>
            </IonRouterOutlet>
          </IonSplitPane>
        </IonContent>
      </IonReactRouter>
    </IonApp>
  )
}
