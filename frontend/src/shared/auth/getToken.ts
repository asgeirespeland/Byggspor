type GetToken = () => Promise<string | null>

export async function getTokenOrThrow(getToken: GetToken): Promise<string> {
  const token = await getToken()
  if (!token) throw new Error('Ikke autentisert')
  return token
}
