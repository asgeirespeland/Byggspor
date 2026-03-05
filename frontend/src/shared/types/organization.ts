export type OrgDto = {
  id: number
  name: string
  org_type: string
  org_number: string | null
}

export type OrgMemberDto = {
  id: number
  user_id: number
  role: string
  user: {
    name: string
    email: string
  }
}
