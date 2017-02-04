import { NgModule } from '@angular/core'

import { LogConfig } from "../toolkit/providers/log-service"

import { configuration, logConfiguration } from "./configuration"
import { Config } from './configuration.token'

@NgModule({
  providers: [
    {
      provide: Config,
      useFactory: configuration
    },
    {
      provide: LogConfig,
      useFactory: logConfiguration
    }
  ]
})
export class ConfigurationModule {
}
