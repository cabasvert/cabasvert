import React, { useEffect } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { IonApp, IonRouterOutlet } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Home } from './pages/Home'

export const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        // @ts-ignore
        <IonRouterOutlet>
          <Route path="/home" component={Home} exact={true}/>
          <Route exact path="/" render={() => <Redirect to="/home"/>}/>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}
