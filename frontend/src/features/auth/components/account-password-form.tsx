import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, LoaderCircle, RefreshCw, ServerOff } from 'lucide-react'

import { ProgressiaLogo } from '@/components/brand/progressia-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type AccountPasswordFormProps = {
  hasToken: boolean
  email?: string
  isValidating: boolean
  validationError: 'invalid' | 'unavailable' | null
  title: string
  successTitle: string
  successDescription: string
  submitLabel: string
  onSubmitPassword: (password: string) => Promise<void>
  onRetryValidation: () => void
}

export function AccountPasswordForm({
  hasToken,
  email,
  isValidating,
  validationError,
  title,
  successTitle,
  successDescription,
  submitLabel,
  onSubmitPassword,
  onRetryValidation,
}: AccountPasswordFormProps) {
  const [submitError, setSubmitError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [minimumLoadingElapsed, setMinimumLoadingElapsed] = useState(false)
  const form = useForm({
    defaultValues: { password: '', confirmation: '' },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmation) return
      setSubmitError(false)
      try {
        await onSubmitPassword(value.password)
        setIsSuccess(true)
      } catch {
        setSubmitError(true)
      }
    },
  })

  useEffect(() => {
    if (!hasToken) return

    const timeoutId = window.setTimeout(
      () => setMinimumLoadingElapsed(true),
      800,
    )
    return () => window.clearTimeout(timeoutId)
  }, [hasToken])

  if (hasToken && (isValidating || !minimumLoadingElapsed)) {
    return (
      <Card
        className="w-full max-w-md items-center p-8 text-center"
        aria-live="polite"
        aria-busy="true"
      >
        <LoaderCircle className="size-9 animate-spin text-primary" />
        <CardTitle className="text-xl">Vérification du lien…</CardTitle>
        <CardDescription>
          Nous vérifions que ce lien est toujours valide.
        </CardDescription>
      </Card>
    )
  }

  if (validationError === 'invalid') {
    return (
      <Card className="w-full max-w-md p-6 text-center">
        <CardTitle>Lien invalide ou expiré</CardTitle>
        <CardDescription>Demandez un nouveau lien à un administrateur.</CardDescription>
      </Card>
    )
  }


  if (validationError === 'unavailable') {
    return (
      <Card className="w-full max-w-md items-center p-6 text-center">
        <ServerOff className="size-10 text-muted-foreground" />
        <CardTitle>Service momentanément indisponible</CardTitle>
        <CardDescription>
          Nous ne pouvons pas vérifier ce lien pour le moment. Il n’est pas nécessairement expiré.
        </CardDescription>
        <Button type="button" variant="outline" onClick={onRetryValidation}>
          <RefreshCw />
          Réessayer
        </Button>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md items-center p-6 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <CardTitle className="text-xl">{successTitle}</CardTitle>
        <CardDescription>{successDescription}</CardDescription>
        <Button render={<Link to="/login" />} nativeButton={false}>Se connecter</Button>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="gap-3">
        <ProgressiaLogo className="mb-3" />
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{email ? `Compte associé à ${email}` : 'Vérification du lien…'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <FieldGroup>
            <form.Field name="password" validators={{ onSubmit: ({ value }) => value.length >= 15 ? undefined : 'Le mot de passe doit contenir au moins 15 caractères.' }}>
              {(field) => <Field><FieldLabel htmlFor={field.name}>Nouveau mot de passe</FieldLabel><Input id={field.name} type="password" autoComplete="new-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /><FieldError>{field.state.meta.errors[0]}</FieldError></Field>}
            </form.Field>
            <form.Field name="confirmation" validators={{ onSubmit: ({ value, fieldApi }) => value === fieldApi.form.getFieldValue('password') ? undefined : 'Les mots de passe ne correspondent pas.' }}>
              {(field) => <Field><FieldLabel htmlFor={field.name}>Confirmer le mot de passe</FieldLabel><Input id={field.name} type="password" autoComplete="new-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /><FieldError>{field.state.meta.errors[0]}</FieldError></Field>}
            </form.Field>
            {submitError && (
              <FieldError>Impossible d’enregistrer le mot de passe. Vérifiez le lien et réessayez.</FieldError>
            )}
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isValidating || !canSubmit || isSubmitting}
                >
                  {isSubmitting && <LoaderCircle className="animate-spin" />}
                  {submitLabel}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
