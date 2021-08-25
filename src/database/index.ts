import mongoose from 'mongoose'
import { Account, AccountModel } from './schemas/account'
import { Cover, CoverModel } from './schemas/cover'
import { PartialRelease, PartialReleaseModel } from './schemas/partial-release'
import { Rating, RatingModel } from './schemas/rating'
import { Release, ReleaseModel } from './schemas/release'
import { SearchResult, SearchResultModel } from './schemas/search-result'

export class Database {
  async getAccount(discordId: string): Promise<Account | undefined> {
    const account = await AccountModel.findOne({ discordId }).exec()
    return account ?? undefined
  }
  async setAccount(account: Account): Promise<Account> {
    const updatedAccount = await AccountModel.findOneAndUpdate(
      { discordId: account.discordId },
      { $set: account },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec()
    return updatedAccount ?? account
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

  async getPartialRelease(
    issueUrl: string
  ): Promise<PartialRelease | undefined> {
    const release = await PartialReleaseModel.findOne({ issueUrl }).exec()
    return release ?? undefined
  }
  async setPartialRelease(release: PartialRelease): Promise<PartialRelease> {
    const updatedRelease = await PartialReleaseModel.findOneAndUpdate(
      { issueUrl: release.issueUrl },
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
  async getRatingsForUrls(urls: string[]): Promise<Rating[]> {
    return RatingModel.find({ issueUrl: { $in: urls } }).exec()
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
const getDatabase = async (): Promise<Database> => {
  if (database === undefined) database = await makeDatabase()
  return database
}

export default getDatabase
