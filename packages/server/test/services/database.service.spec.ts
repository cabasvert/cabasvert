import 'jasmine'
import * as winston from 'winston'
import { defaultConfiguration } from '../../src/config'

import { DatabaseService } from '../../src/services/database.service'

const PouchDB = require('pouchdb-core')
  .plugin(require('pouchdb-adapter-http'))
  .plugin(require('pouchdb-find'))
  .plugin(require('pouchdb-authentication'))
  .plugin(require('pouchdb-security-helper'))

describe('DatabaseService', () => {

  let configuration = defaultConfiguration()

  let serverUser = configuration.database.auth

  let databaseService
  let database

  beforeEach(async () => {

    let nullLogger = new winston.Logger()
    databaseService = new DatabaseService(configuration, nullLogger)

    // Create user database
    database = new PouchDB(configuration.database.url + '/_users', { skip_setup: true })

    await database.signUpAdmin('admin', 'password')
    await database.logIn('admin', 'password')

    // Add server admin user
    await database.signUp(serverUser.username, serverUser.password, {
      roles: ['cabasvert:admin'],
    })

    try {
      let security = database.security()
      await security.fetch()
      security.admins.roles.add('cabasvert:admin')
      await security.save()
    } catch (e) {
    }

    // Add a fake user to database
    await database.signUp('john.doe@example.com', 'password', {
      metadata: {
        metadata: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      },
    })

    await database.logOut()
  })

  afterEach(async () => {
    await database.logIn('admin', 'password')

    try {
      let security = database.security()
      await security.fetch()
      security.reset()
      await security.save()
    } catch (e) {
    }

    await database.deleteUser(serverUser.username)

    await database.deleteUser('john.doe@example.com')

    await database.deleteAdmin('admin')
    await database.logOut()
  })

  it('initializes properly', async () => {
    await databaseService.initialize()
  })

  it('can\'t initialize properly if server user does not exist', async () => {
    await database.logIn('admin', 'password')
    await database.deleteUser(serverUser.username)
    await database.logOut()

    try {

      await databaseService.initialize()
        .then(() => Promise.reject(new Error('Should not have initialized properly')))
        .catch(() => {
        })

    } finally {

      await database.logIn('admin', 'password')
      await database.signUp(serverUser.username, serverUser.password, {
        roles: ['cabasvert:admin'],
      })
      await database.logOut()
    }
  })

  it('can retrieve users by their id', async () => {
    await databaseService.initialize()

    let user = await databaseService.getUser('john.doe@example.com')

    expect(user).toEqual(jasmine.objectContaining({
      _id: 'org.couchdb.user:john.doe@example.com',
      name: 'john.doe@example.com',
      roles: [],
      type: 'user',
      metadata: { name: 'John Doe', email: 'john.doe@example.com' },
    }))
  })

  it('can update users\' metadata', async () => {
    await databaseService.initialize()

    expect(
      await databaseService.updateUser('john.doe@example.com', {
        metadata: {
          newMetadata: 'metadata',
        },
      }),
    ).toEqual(jasmine.objectContaining({ ok: true }))

    let user = await databaseService.getUser('john.doe@example.com')

    expect(user).toEqual(jasmine.objectContaining({
      newMetadata: 'metadata',
    }))
  })

  it('can change users\' passwords', async () => {
    await databaseService.initialize()

    expect(
      await databaseService.changePassword('john.doe@example.com', 'newPassword'),
    ).toEqual(true)

    await database.logOut()

    expect(
      await database.logIn('john.doe@example.com', 'newPassword'),
    ).toEqual({ ok: true, name: 'john.doe@example.com', roles: [] })

    await database.logOut()
  })
})
