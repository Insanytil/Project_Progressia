import { useMutation } from '@tanstack/react-query'

import {
  confirmMemberImport,
  previewMemberImport,
  previewMemberImportFile,
} from '../api/member-import-api'
import type {
  BulkMemberRole,
  MemberImportTarget,
} from '../model/member-import.types'

export function usePreviewMemberImportMutation() {
  return useMutation({
    mutationFn: ({ target, role, emails }: {
      target: MemberImportTarget
      role: BulkMemberRole
      emails: string[]
    }) => previewMemberImport(target, role, emails),
  })
}

export function usePreviewMemberImportFileMutation() {
  return useMutation({
    mutationFn: ({ target, role, file }: {
      target: MemberImportTarget
      role: BulkMemberRole
      file: File
    }) => previewMemberImportFile(target, role, file),
  })
}

export function useConfirmMemberImportMutation() {
  return useMutation({
    mutationFn: ({ target, role, emails }: {
      target: MemberImportTarget
      role: BulkMemberRole
      emails: string[]
    }) => confirmMemberImport(target, role, emails),
  })
}
