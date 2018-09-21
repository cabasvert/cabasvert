import { LogLevel } from '../app/toolkit/providers/log.model';

export const environment = {
  production: true,
  loadDevCredentials: false,
  enableRouteTracing: false,
  localeOverride: null,
  configFileName: 'config.prod.json',
  defaultLogLevel: LogLevel.WARN,
};
