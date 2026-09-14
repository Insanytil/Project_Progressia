import { Sparkles } from 'lucide-react'

import { ProgressiaLogo } from '@/components/brand/progressia-logo'

export function LoginHero() {
  return (
    <div className="relative hidden min-h-[650px] overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 top-16 size-72 rounded-full border-[52px] border-accent/20" />
      <div className="absolute -bottom-32 -left-24 size-80 rounded-full bg-[#578FCA]/70" />
      <div className="absolute bottom-28 right-14 grid grid-cols-4 gap-2 opacity-25" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, index) => (
          <span key={index} className="size-1.5 rounded-full bg-white" />
        ))}
      </div>

      <ProgressiaLogo className="relative" inverted />

      <div className="relative max-w-md">
        <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Sparkles className="size-6 text-secondary" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.035em]">
          Chaque progrès mérite d’être visible.
        </h1>
        <p className="mt-5 max-w-sm text-base leading-7 text-blue-50/80">
          Retrouvez votre espace et continuez à avancer, une étape après l’autre.
        </p>
      </div>

      <p className="relative text-sm text-blue-100/65">Votre progression, simplement.</p>
    </div>
  )
}
