import { PasswordResetForm } from '@/features/auth'

export function PasswordResetPage({ token }: { token: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f5fbff] p-5">
      <PasswordResetForm token={token} />
    </main>
  )
}
