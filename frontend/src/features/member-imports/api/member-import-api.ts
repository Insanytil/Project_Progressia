import { apiClient } from '@/lib/api/client'

import type {
  BulkMemberRole,
  MemberImportPreview,
  MemberImportResult,
  MemberImportTarget,
} from '../model/member-import.types'

const scopeHeaders = (target: MemberImportTarget) => target.kind === 'organization'
  ? { 'X-Organization-ID': target.organizationId }
  : undefined

function importPath(target: MemberImportTarget, role: BulkMemberRole) {
  return target.kind === 'platform'
    ? `/platform/organizations/${target.organizationId}/member-imports/${role}`
    : `/organization-administration/member-imports/${role}`
}

export async function previewMemberImport(
  target: MemberImportTarget,
  role: BulkMemberRole,
  emails: string[],
): Promise<MemberImportPreview> {
  const { data } = await apiClient.post<MemberImportPreview>(
    `${importPath(target, role)}/preview`,
    { emails },
    { headers: scopeHeaders(target) },
  )
  return data
}

export async function previewMemberImportFile(
  target: MemberImportTarget,
  role: BulkMemberRole,
  file: File,
): Promise<MemberImportPreview> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await apiClient.post<MemberImportPreview>(
    `${importPath(target, role)}/preview-file`,
    body,
    { headers: scopeHeaders(target) },
  )
  return data
}

export async function confirmMemberImport(
  target: MemberImportTarget,
  role: BulkMemberRole,
  emails: string[],
): Promise<MemberImportResult> {
  const { data } = await apiClient.post<MemberImportResult>(
    importPath(target, role),
    { emails },
    { headers: scopeHeaders(target) },
  )
  return data
}
