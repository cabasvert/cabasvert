import { Symbol } from 'typescript'

export const Services = {
  Config: Symbol.for('Configuration'),
  Logger: Symbol.for('Logger'),
  Database: Symbol.for('DatabaseService'),
  Mail: Symbol.for('MailService'),
  Token: Symbol.for('TokenService'),
}
