import * as SMTPTransport from 'nodemailer/lib/smtp-transport'

export const PORT = process.env['PORT'] || 8080

export const DATABASE_URL = process.env['COUCHDB_URL'] || 'http://localhost:5984/'

export const CLIENT_APP_URL = process.env['CLIENT_APP_URL'] || 'http://localhost:8080/'

export const DATABASE_USER = {
  username: process.env['COUCHDB_SERVER_USERNAME'] || 'server-username',
  password: process.env['COUCHDB_SERVER_PASSWORD'] || 'server-password',
}

export const SMTP_CONNECTION_DATA: SMTPTransport.Options = {
  host: process.env['SERVER_EMAIL_HOST'],
  port: Number.parseInt(process.env['SERVER_EMAIL_PORT']),
  secure: process.env['SERVER_EMAIL_USE_TLS'] === 'true',
  auth: {
    user: process.env['SERVER_EMAIL_USERNAME'],
    pass: process.env['SERVER_EMAIL_PASSWORD'],
  },
}
