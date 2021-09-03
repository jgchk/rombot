import { either } from 'fp-ts'
import { InvalidCredentialsError } from '../errors'
import { gott, limiter } from '../utils/network'

export const login = async (
  username: string,
  password: string
): Promise<either.Either<InvalidCredentialsError, true>> => {
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
    ? either.right(true)
    : either.left(new InvalidCredentialsError())
}
