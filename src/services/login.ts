import { Either, left, right } from 'fp-ts/Either'
import { InvalidCredentialsError } from '../errors'
import { gott, limiter } from '../utils/network'

export const login = async (
  username: string,
  password: string
): Promise<Either<InvalidCredentialsError, true>> => {
  const response = await limiter.schedule(() =>
    gott('https://rateyourmusic.com/httprequest/Login', {
      method: 'POST',
      form: {
        user: username,
        password: password,
        remember: true,
        maintain_session: true,
        action: 'Login',
        rym_ajax_req: 1,
        request_token: '',
      },
    })
  )

  return response.body.toLowerCase().includes('success')
    ? right(true)
    : left(new InvalidCredentialsError())
}
