/* eslint-disable unicorn/consistent-function-scoping */

import cheerio from 'cheerio'
import {
  array,
  console,
  either,
  io,
  option,
  readonlyArray,
  task,
  taskEither,
} from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { HTTPError } from 'got'
import { Db, ObjectId } from 'mongodb'
import { MissingDataError, UsernameDoesntExistError } from '../src/errors'
import { makeUserUrl } from '../src/utils/links'
import { gott, limiter } from '../src/utils/network'

type OldDiscordUser = {
  discordId: string
  username: string | null
}

type NewDiscordUser = {
  discordId: string
  rymAccount: ObjectId | null
}

type RymAccount = {
  username: string
  accountId: string
}

const OLD_DISCORDUSERS_COLLECTION = 'accounts'
const NEW_DISCORDUSERS_COLLECTION = 'discordusers'
const RYMACCOUNTS_COLLECTION = 'rymaccounts'

export const getRymAccountId =
  (
    username: string
  ): taskEither.TaskEither<
    MissingDataError | UsernameDoesntExistError,
    string
  > =>
  async () => {
    try {
      const response = await limiter.schedule(() => gott(makeUserUrl(username)))
      const $ = cheerio.load(response.body)
      const text = $('.profile_header').text() || undefined
      if (text === undefined)
        return either.left(
          new MissingDataError(`rym account id for ${username}`)
        )

      const id = /#(\d+)/.exec(text)?.[1]
      if (id === undefined)
        return either.left(
          new MissingDataError(`rym account id for ${username}`)
        )

      return either.right(id)
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        return either.left(new UsernameDoesntExistError(username))
      } else {
        throw error
      }
    }
  }

class DatabaseError extends Error {
  name: 'DatabaseError'

  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

module.exports = {
  async up(database: Db) {
    const migrationResult = await migrate(database)()

    const failedMigrations = pipe(
      migrationResult,
      readonlyArray.filterMap(
        either.fold(
          (error) => option.some(error),
          () => option.none
        )
      )
    )
    if (failedMigrations.length > 0) {
      console.error('FAILED MIGRATIONS')()
      pipe(
        failedMigrations,
        readonlyArray.map(console.error),
        io.sequenceArray
      )()
    }
  },

  async down(database: Db) {
    const migrationResult = await unmigrate(database)()

    const failedMigrations = pipe(
      migrationResult,
      readonlyArray.filterMap(
        either.fold(
          (error) => option.some(error),
          () => option.none
        )
      )
    )
    if (failedMigrations.length > 0) {
      console.error('FAILED MIGRATIONS')()
      console.error(
        `\n---\n${RYMACCOUNTS_COLLECTION} collection was left in the database. You will need to manually drop it after fixing the failed migrations.\n---\n`
      )()
      pipe(
        failedMigrations,
        readonlyArray.map(console.error),
        io.sequenceArray
      )()
    }
  },
}

// if username is not null:
//   - grab rym account id
//   - push account to collection
//   - set rymAccount field to pushed account id
// whether username is or is not null, delete username field
const migrate = (database: Db) =>
  pipe(
    () =>
      database.renameCollection(
        OLD_DISCORDUSERS_COLLECTION,
        NEW_DISCORDUSERS_COLLECTION
      ),
    task.chain(() => () => database.createCollection(RYMACCOUNTS_COLLECTION)),
    task.chain(
      () => () =>
        database.collection(NEW_DISCORDUSERS_COLLECTION).find({}).toArray()
    ),
    task.chain(
      flow(
        array.map(({ discordId, username }: OldDiscordUser) =>
          pipe(
            username !== null
              ? migrateUsernameToRymAccount(username, discordId, database)
              : setRymAccountToNull(discordId, database),
            taskEither.chainW(() => removeUsernameField(discordId, database))
          )
        ),
        task.sequenceArray
      )
    )
  )

const migrateUsernameToRymAccount = (
  username: string,
  discordId: string,
  database: Db
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError | DatabaseError,
  true
> =>
  pipe(
    // grab rym account id
    getRymAccountId(username),
    taskEither.map<string, RymAccount>((accountId) => ({
      username,
      accountId,
    })),
    // push rym account to collection
    taskEither.chainW((rymAccount) =>
      pipe(
        () => database.collection(RYMACCOUNTS_COLLECTION).insertOne(rymAccount),
        task.map((result) =>
          result.insertedId
            ? either.right(result.insertedId as ObjectId)
            : either.left(
                new DatabaseError(
                  `username ${username}: failed to add new RymAccount to database`
                )
              )
        )
      )
    ),
    // set rymAccount field to pushed account id
    taskEither.chainW((rymAccountId) =>
      pipe(
        () =>
          database
            .collection(NEW_DISCORDUSERS_COLLECTION)
            .updateOne({ discordId }, { $set: { rymAccount: rymAccountId } }),
        task.map((result) =>
          result.modifiedCount === 1
            ? either.right(true)
            : either.left(
                new DatabaseError(
                  `username ${username}: failed to set DiscordUser rymAccount field`
                )
              )
        )
      )
    )
  )

const setRymAccountToNull = (
  discordId: string,
  database: Db
): taskEither.TaskEither<DatabaseError, true> =>
  pipe(
    () =>
      database
        .collection(NEW_DISCORDUSERS_COLLECTION)
        .updateOne({ discordId }, { $set: { rymAccount: null } }),
    task.map((result) =>
      result.modifiedCount === 1
        ? either.right(true)
        : either.left(
            new DatabaseError(
              `discordId ${discordId}: failed to set DiscordUser rymAccount field`
            )
          )
    )
  )

const removeUsernameField = (
  discordId: string,
  database: Db
): taskEither.TaskEither<DatabaseError, string> =>
  pipe(
    () =>
      database
        .collection(NEW_DISCORDUSERS_COLLECTION)
        .updateOne({ discordId }, { $unset: { username: 1 } }),
    task.map((result) =>
      result.modifiedCount === 1
        ? either.right(discordId)
        : either.left(
            new DatabaseError(
              `discordId ${discordId}: failed to remove DiscordUser username field`
            )
          )
    )
  )

// for each discorduser:
//   - if rymAccount is null, set username to null
//   - if rymAccount is not null, fetch username from rymAccount and set username to that
//   - delete rymAccount field
// delete rymaccounts collection
// rename discordusers to accounts
const unmigrate = (database: Db) =>
  pipe(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    () => database.collection(NEW_DISCORDUSERS_COLLECTION).find({}).toArray(),
    task.chain(
      flow(
        array.map(({ discordId, rymAccount }: NewDiscordUser) =>
          pipe(
            rymAccount !== null
              ? unmigrateRymAccountToUsername(rymAccount, discordId, database)
              : setUsernameToNull(discordId, database),
            taskEither.chainW(() => removeRymAccountField(discordId, database))
          )
        ),
        task.sequenceArray
      )
    ),
    task.chain((results) => async () => {
      await database.renameCollection(
        NEW_DISCORDUSERS_COLLECTION,
        OLD_DISCORDUSERS_COLLECTION
      )
      return results
    }),
    task.chain((results) => async () => {
      if (results.every(either.isRight))
        await database.dropCollection(RYMACCOUNTS_COLLECTION)
      return results
    })
  )

const unmigrateRymAccountToUsername = (
  rymAccountId: ObjectId,
  discordId: string,
  database: Db
) =>
  pipe(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      database
        .collection(RYMACCOUNTS_COLLECTION)
        .findOne({ _id: rymAccountId }),
    task.map((rymAccount: RymAccount | null) =>
      either.fromNullable(
        new DatabaseError(`discordId ${discordId}: failed to fetch RymAccount`)
      )(rymAccount)
    ),
    taskEither.chain(({ username }) =>
      pipe(
        () =>
          database
            .collection(NEW_DISCORDUSERS_COLLECTION)
            .updateOne({ discordId }, { $set: { username } }),
        task.map((result) =>
          result.modifiedCount === 1
            ? either.right(discordId)
            : either.left(
                new DatabaseError(
                  `discordId ${discordId}: failed to set DiscordUser username field`
                )
              )
        )
      )
    )
  )

const setUsernameToNull = (
  discordId: string,
  database: Db
): taskEither.TaskEither<DatabaseError, string> =>
  pipe(
    () =>
      database
        .collection(NEW_DISCORDUSERS_COLLECTION)
        .updateOne({ discordId }, { $set: { username: null } }),
    task.map((result) =>
      result.modifiedCount === 1
        ? either.right(discordId)
        : either.left(
            new DatabaseError(
              `discordId ${discordId}: failed to set DiscordUser username field`
            )
          )
    )
  )

const removeRymAccountField = (
  discordId: string,
  database: Db
): taskEither.TaskEither<DatabaseError, string> =>
  pipe(
    () =>
      database
        .collection(NEW_DISCORDUSERS_COLLECTION)
        .updateOne({ discordId }, { $unset: { rymAccount: 1 } }),
    task.map((result) =>
      result.modifiedCount === 1
        ? either.right(discordId)
        : either.left(
            new DatabaseError(
              `discordId ${discordId}: failed to remove DiscordUser rymAccount field`
            )
          )
    )
  )
