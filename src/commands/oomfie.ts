import { MessageEmbed } from 'discord.js'
import {
  array,
  number,
  option,
  ord,
  readonlyArray,
  task,
  taskEither,
  taskOption,
} from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { compareTwoStrings } from 'string-similarity'
import getDatabase from '../database'
import { getUsernameForUser } from '../services/account'
import { Command, MessageOutput } from '../types'
import { makeUserLink } from '../utils/render'
import { isNotNull } from '../utils/types'

const oomfie: Command = {
  name: 'oomfie',
  description: 'find your oomfie',
  aliases: ['oomf'],
  usage: 'oomfie',
  examples: ['oomfie'],
  execute: (message) =>
    pipe(
      getUsernameForUser(message.message.author),
      taskEither.chain((requesterUsername) =>
        taskEither.fromTask(pipe(getOomfieEmbed(requesterUsername)))
      ),
      taskEither.map(option.some)
    ),
}

const getOomfieEmbed = (username: string): task.Task<MessageOutput> =>
  pipe(
    getOomfie(username),
    task.map(
      option.foldW(
        () => "Sorry friend, you don't have an oomfie rn :(",
        (oomfie) => ({
          embeds: [
            new MessageEmbed()
              .setTitle('Oomfie Located!! :D')
              .setDescription(`Your oomfie is ${makeUserLink(oomfie)}! ❤️`)
              .setThumbnail(
                'https://c.tenor.com/Z3FcD6KCEHUAAAAC/klee-genshin-impact.gif'
              ),
          ],
        })
      )
    )
  )

const getOomfie = (username: string): taskOption.TaskOption<string> =>
  pipe(
    getRatingComparisons(username),
    task.map((ratingComparisons) =>
      pipe(
        ratingComparisons,
        readonlyArray.sort(
          ord.reverse(
            ord.contramap(
              (ratingComparison: RatingComparison) =>
                ratingComparison.similarity
            )(number.Ord)
          )
        ),
        readonlyArray.head,
        option.map((topRatingComparison) => topRatingComparison.username)
      )
    )
  )

type RatingComparison = { username: string; similarity: number }
const getRatingComparisons = (
  username: string
): task.Task<readonly RatingComparison[]> =>
  pipe(
    getStringifiedRatings(username),
    task.chain((requesterRatingsString) =>
      pipe(
        getDatabase(),
        task.chain((database) => database.getAllAccounts()),
        task.map((accounts) =>
          pipe(
            accounts,
            array.map((account) => account.username),
            array.filter(isNotNull),
            array.filter((accountUsername) => accountUsername !== username)
          )
        ),
        task.chain((comparisonUsernames) =>
          pipe(
            comparisonUsernames,
            array.map((comparisonUsername) =>
              pipe(
                getStringifiedRatings(comparisonUsername),
                task.map((comparisonRatingsString) => ({
                  username: comparisonUsername,
                  similarity: compareTwoStrings(
                    requesterRatingsString,
                    comparisonRatingsString
                  ),
                }))
              )
            ),
            task.sequenceArray
          )
        )
      )
    )
  )

const getStringifiedRatings = (username: string): task.Task<string> =>
  pipe(
    getDatabase(),
    task.chain((database) => database.getUserRatings(username)),
    task.map((requesterRatings) => JSON.stringify(requesterRatings))
  )

export default oomfie
