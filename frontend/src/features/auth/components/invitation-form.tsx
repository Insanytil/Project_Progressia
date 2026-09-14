import { useQuery } from '@tanstack/react-query'

import { acceptInvitation } from '../api/auth-api'
import { isNotFoundError } from '../api/auth-errors'
import { invitationQueryOptions } from '../queries/auth-queries'
import { AccountPasswordForm } from './account-password-form'

export function InvitationForm({ token }: { token: string }) {
  const invitationQuery = useQuery({
    ...invitationQueryOptions(token),
    enabled: Boolean(token),
  })
  const validationError = !token
    ? 'invalid'
    : invitationQuery.isError
      ? isNotFoundError(invitationQuery.error) ? 'invalid' : 'unavailable'
      : null

  return (
    <AccountPasswordForm
      hasToken={Boolean(token)}
      email={invitationQuery.data?.email}
      isValidating={invitationQuery.isPending || invitationQuery.isFetching}
      validationError={validationError}
      title="Activez votre compte"
      successTitle="Compte activé"
      successDescription="Votre mot de passe est défini et votre adresse est vérifiée."
      submitLabel="Activer mon compte"
      onSubmitPassword={(password) => acceptInvitation({ token, password })}
      onRetryValidation={() => void invitationQuery.refetch()}
    />
  )
}
