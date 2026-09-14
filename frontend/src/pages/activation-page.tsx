import { InvitationForm } from '@/features/auth'

export function ActivationPage({ token }: { token: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f5fbff] p-5">
      <InvitationForm token={token} />
    </main>
  )
}
