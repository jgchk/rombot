import { MessageEmbed } from 'discord.js'
import { option } from 'fp-ts'
import { left, right } from 'fp-ts/Either'
import { compareTwoStrings } from 'string-similarity'
import getDatabase from '../database'
import { UsernameNotFoundError } from '../errors'
import { getUsernameForUser } from '../services/account'
import { Command } from '../types'
import { makeUserLink } from '../utils/render'
import { isNotNull } from '../utils/types'

const oomfie: Command = {
  name: 'oomfie',
  description: 'find your oomfie',
  usage: 'oomfie',
  examples: ['oomfie'],
  execute: (message) => async () => {
    const requesterUsername = await getUsernameForUser(message.message.author)
    if (requesterUsername === undefined)
      return left(new UsernameNotFoundError(message.message.author))

    const database = await getDatabase()
    const requesterRatings = await database.getUserRatings(requesterUsername)
    const requesterRatingsString = JSON.stringify(requesterRatings)

    const comparisonUsernames = (await database.getAllAccounts())
      .map((account) => account.username)
      .filter(isNotNull)
      .filter((username_) => username_ !== requesterUsername)

    const similarities: { username: string; similarity: number }[] =
      await Promise.all(
        comparisonUsernames.map(async (comparisonUsername) => {
          const comparisonRatings = await database.getUserRatings(
            comparisonUsername
          )
          const comparisonRatingsString = JSON.stringify(comparisonRatings)

          const similarity = compareTwoStrings(
            requesterRatingsString,
            comparisonRatingsString
          )

          return { username: comparisonUsername, similarity }
        })
      )

    console.log(similarities)

    const mostSimilar = similarities
      .sort((a, b) => a.similarity - b.similarity)
      .pop()
    if (mostSimilar === undefined)
      return right(option.some("Sorry friend, you don't have an oomfie rn :("))

    return right(
      option.some({
        embeds: [
          new MessageEmbed()
            .setTitle('Oomfie Located!! :D')
            .setDescription(
              `Your oomfie is ~${makeUserLink(mostSimilar.username)}! ❤️`
            )
            .setThumbnail(
              'https://c.tenor.com/Z3FcD6KCEHUAAAAC/klee-genshin-impact.gif'
            ),
        ],
      })
    )
  },
}

export default oomfie
