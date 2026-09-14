import { LoginForm, LoginHero } from '@/features/auth'

export function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f5fbff] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-accent/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-secondary/80 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_32px_90px_-45px_rgba(54,116,181,0.5)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <LoginHero />
        <div className="flex min-h-[620px] items-center justify-center p-5 sm:p-10 lg:p-12">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
