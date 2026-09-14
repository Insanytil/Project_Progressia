import { useQuery } from '@tanstack/react-query'

import { acceptPasswordReset } from '../api/auth-api'
import { isNotFoundError } from '../api/auth-errors'
import { passwordResetQueryOptions } from '../queries/auth-queries'
import { AccountPasswordForm } from './account-password-form'

export function PasswordResetForm({ token }: { token: string }) {
  const resetQuery = useQuery({
    ...passwordResetQueryOptions(token),
    enabled: Boolean(token),
  })
  const validationError = !token
    ? 'invalid'
    : resetQuery.isError
      ? isNotFoundError(resetQuery.error) ? 'invalid' : 'unavailable'
      : null

  return (
    <AccountPasswordForm
      hasToken={Boolean(token)}
      email={resetQuery.data?.email}
      isValidating={resetQuery.isPending || resetQuery.isFetching}
      validationError={validationError}
      title="Réinitialisez votre mot de passe"
      successTitle="Mot de passe modifié"
      successDescription="Votre nouveau mot de passe est enregistré. Vos anciennes sessions ont été fermées."
      submitLabel="Enregistrer le mot de passe"
      onSubmitPassword={(password) => acceptPasswordReset({ token, password })}
      onRetryValidation={() => void resetQuery.refetch()}
    />
  )
}
