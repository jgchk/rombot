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
    }).then((res) => res.text())
    console.log({ res })
    return res.toLowerCase().includes('success')
  }
