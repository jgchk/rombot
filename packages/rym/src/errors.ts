export class MissingDataError extends Error {
  name: 'MissingDataError'

  constructor(missingData: string) {
    super(`Error fetching data :(\nCould not find ${missingData}`)
    this.name = 'MissingDataError'
  }
}
