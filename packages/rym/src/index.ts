import type { Fetch } from 'utils/browser'

export const login =
  (fetch: Fetch) =>
  async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch('https://rateyourmusic.com/httprequest/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user: username,
        password: password,
        remember: 'true',
        maintain_session: 'true',
        action: 'Login',
        rym_ajax_req: '1',
        request_token: '',
      }),
    })
    const text = await res.text()
    const isSuccess = text.toLowerCase().includes('success')
    return isSuccess
      ? { isLoggedIn: true, cookies: res.headers.get('set-cookie') }
      : { isLoggedIn: false }
  }
