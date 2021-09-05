/* eslint-disable unicorn/consistent-function-scoping */

import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Db } from 'mongodb'

// 'accounts' collection -> 'discordusers' collection
// Account.username -> DiscordUser.rymUsername
module.exports = {
  async up(database: Db) {
    await migrate(database)()
  },
  async down(database: Db) {
    await unmigrate(database)()
  },
}

const OLD_DISCORDUSERS_COLLECTION = 'accounts'
const NEW_DISCORDUSERS_COLLECTION = 'discordusers'

const migrate = (database: Db) =>
  pipe(
    () =>
      database.renameCollection(
        OLD_DISCORDUSERS_COLLECTION,
        NEW_DISCORDUSERS_COLLECTION
      ),
    task.chain(
      () => () =>
        database
          .collection(NEW_DISCORDUSERS_COLLECTION)
          .updateMany({}, { $rename: { username: 'rymUsername' } })
    )
  )

const unmigrate = (database: Db) =>
  pipe(
    () =>
      database.renameCollection(
        NEW_DISCORDUSERS_COLLECTION,
        OLD_DISCORDUSERS_COLLECTION
      ),
    task.chain(
      () => () =>
        database
          .collection(OLD_DISCORDUSERS_COLLECTION)
          .updateMany({}, { $rename: { rymUsername: 'username' } })
    )
  )
