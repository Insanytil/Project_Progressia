import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'

import { ProgressiaLogo } from '@/components/brand/progressia-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { getLoginErrorMessage } from '../api/auth-errors'
import { useLoginMutation } from '../mutations/use-auth-mutations'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string) {
  if (!value.trim()) return 'Saisissez votre adresse e-mail.'
  if (!emailPattern.test(value)) return 'Saisissez une adresse e-mail valide.'
  return undefined
}

function validatePassword(value: string) {
  return value ? undefined : 'Saisissez votre mot de passe.'
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLoginMutation()
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        await loginMutation.mutateAsync(value)
        await navigate({ to: '/dashboard' })
      } catch {
        // The mutation error is displayed in the form.
      }
    },
  })

  return (
    <Card className="w-full max-w-md gap-7 border-0 bg-transparent py-0 shadow-none ring-0">
      <CardHeader className="gap-3 px-0">
        <ProgressiaLogo className="mb-3 lg:hidden" />
        <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-3xl font-semibold tracking-[-0.03em]">Bon retour parmi nous</CardTitle>
        <CardDescription className="text-base leading-6">
          Connectez-vous pour accéder à votre espace Progressia.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-5">
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) => validateEmail(value),
                onSubmit: ({ value }) => validateEmail(value),
              }}
            >
              {(field) => {
                const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined

                return (
                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor={field.name}>Adresse e-mail</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      className="h-11 bg-white/80 px-3.5"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={Boolean(error)}
                    />
                    <FieldError>{error}</FieldError>
                  </Field>
                )
              }}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) => validatePassword(value),
                onSubmit: ({ value }) => validatePassword(value),
              }}
            >
              {(field) => {
                const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined

                return (
                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Votre mot de passe"
                        className="h-11 bg-white/80 px-3.5 pr-11"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={Boolean(error)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FieldError>{error}</FieldError>
                  </Field>
                )
              }}
            </form.Field>

            {loginMutation.isError && (
              <p role="alert" className="rounded-xl border border-destructive/15 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
                {getLoginErrorMessage(loginMutation.error)}
              </p>
            )}

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="lg"
                  className="mt-1 h-11 w-full shadow-lg shadow-primary/20"
                  disabled={!canSubmit || isSubmitting || loginMutation.isPending}
                >
                  {isSubmitting || loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
                  {!isSubmitting && !loginMutation.isPending && <ArrowRight data-icon="inline-end" />}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Besoin d’aide ?{' '}
          <a href="mailto:support@progressia.app" className="font-medium text-primary hover:underline">
            Contacter le support
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
