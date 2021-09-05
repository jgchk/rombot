import { option, task, taskOption } from 'fp-ts'
import mongoose from 'mongoose'
import { Cover, CoverModel } from './schemas/cover'
import { DiscordUser, DiscordUserModel } from './schemas/discord-user'
import { Rating, RatingModel } from './schemas/rating'
import { Release, ReleaseModel } from './schemas/release'
import { RymAccount, RymAccountModel } from './schemas/rym-account'
import { SearchResult, SearchResultModel } from './schemas/search-result'
import { Server, ServerModel } from './schemas/server'

export class Database {
  async getDiscordUser(discordId: string): Promise<DiscordUser | undefined> {
    const discordUser = await DiscordUserModel.findOne({ discordId }).exec()
    return discordUser ?? undefined
  }
  setDiscordUser(discordUser: DiscordUser): task.Task<DiscordUser> {
    return async () => {
      const updatedDiscordUser = await DiscordUserModel.findOneAndUpdate(
        { discordId: discordUser.discordId },
        { $set: discordUser as unknown as DiscordUser },
        { upsert: true, setDefaultsOnInsert: true }
      ).exec()
      return updatedDiscordUser ?? discordUser
    }
  }
  getAllDiscordUsers(): task.Task<DiscordUser[]> {
    return () => DiscordUserModel.find().exec()
  }

  getRymAccount(username: string): taskOption.TaskOption<RymAccount> {
    return async () => {
      const rymAccount = await RymAccountModel.findOne({ username }).exec()
      return option.fromNullable(rymAccount)
    }
  }
  setRymAccount(rymAccount: RymAccount): task.Task<RymAccount> {
    return async () => {
      const updatedRymAccount = await RymAccountModel.findOneAndUpdate(
        { username: rymAccount.username },
        { $set: rymAccount },
        { upsert: true, setDefaultsOnInsert: true }
      ).exec()
      return updatedRymAccount ?? rymAccount
    }
  }

  async getSearchResult(query: string): Promise<SearchResult | undefined> {
    const result = await SearchResultModel.findOne({ query }).exec()
    return result ?? undefined
  }
  async setSearchResult(result: SearchResult): Promise<SearchResult> {
    const updatedResult = await SearchResultModel.findOneAndUpdate(
      { query: result.query },
      { $set: result },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedResult ?? result
  }

  async getRelease(url: string): Promise<Release | undefined> {
    const release = await ReleaseModel.findOne({ url }).exec()
    return release ?? undefined
  }
  async getCombinedRelease(url: string): Promise<Release | undefined> {
    const release = await ReleaseModel.findOne({ url }).exec()
    if (release === null) return
    if (release.combinedUrl === url) return release
    return this.getRelease(release.combinedUrl)
  }
  async setRelease(release: Release): Promise<Release> {
    const updatedRelease = await ReleaseModel.findOneAndUpdate(
      { url: release.url },
      { $set: release },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedRelease ?? release
  }

  async setRating(rating: Rating): Promise<Rating> {
    const updatedRating = await RatingModel.findOneAndUpdate(
      { issueUrl: rating.issueUrl, username: rating.username },
      { $set: rating },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedRating ?? rating
  }
  getUserRatings(username: string): task.Task<Rating[]> {
    return () => RatingModel.find({ username }).exec()
  }

  async setCover(cover: Cover): Promise<Cover> {
    const updatedCover = await CoverModel.findOneAndUpdate(
      { issueUrl: cover.issueUrl },
      { $set: cover },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedCover ?? cover
  }
  async getCover(
    searchQuery: { issueUrl: string } | { imageUrl: string }
  ): Promise<Cover | undefined> {
    const cover = await CoverModel.findOne(searchQuery).exec()
    return cover ?? undefined
  }

  async setServer(server: Server): Promise<Server> {
    const updatedServer = await ServerModel.findOneAndUpdate(
      { id: server.id },
      { $set: server },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedServer ?? server
  }
  async getServer(id: string): Promise<Server | undefined> {
    const server = await ServerModel.findOne({ id }).exec()
    return server ?? undefined
  }
}

const makeDatabase = (): Promise<Database> =>
  new Promise((resolve) => {
    mongoose.connection.once('open', () => resolve(new Database()))
    void mongoose.connect('mongodb://localhost:27017/rombot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
  })

let database: Database | undefined
// eslint-disable-next-line unicorn/consistent-function-scoping
const getDatabase = (): task.Task<Database> => async () => {
  if (database === undefined) database = await makeDatabase()
  return database
}

export default getDatabase
