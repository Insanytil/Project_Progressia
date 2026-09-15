export type BulkMemberRole = 'teacher' | 'student'

export type MemberImportTarget =
  | { kind: 'organization'; organizationId: string }
  | { kind: 'platform'; organizationId: string }

export type MemberImportPreviewRow = {
  row: number
  email: string
  is_valid: boolean
  error: string | null
}

export type MemberImportPreview = {
  rows: MemberImportPreviewRow[]
  total: number
  valid: number
  invalid: number
  can_confirm: boolean
}

export type MemberImportResult = {
  created: number
  invitations_queued: number
}
