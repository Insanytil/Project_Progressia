import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">
        Progressia
      </h1>
    </main>
  )
}