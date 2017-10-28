import { Symbol } from 'typescript'

export const Services = {
  Logger: Symbol.for('Logger'),
  Database: Symbol.for('DatabaseService'),
  Mail: Symbol.for('MailService'),
  Token: Symbol.for('TokenService'),
}
