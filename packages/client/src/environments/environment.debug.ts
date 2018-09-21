import { LogLevel } from '../app/toolkit/providers/log.model';

export const environment = {
  production: false,
  loadDevCredentials: false,
  enableRouteTracing: true,
  localeOverride: null,
  configFileName: 'config.prod.json',
  defaultLogLevel: LogLevel.DEBUG,
};
