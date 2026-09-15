import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CourseOptionEditor(props: {
  values: string[]
  onChange: (values: string[]) => void
  allowEmpty?: boolean
}) {
  function update(index: number, value: string) {
    props.onChange(props.values.map((item, itemIndex) => (
      itemIndex === index ? value : item
    )))
  }

  function remove(index: number) {
    props.onChange(props.values.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-2">
      {props.values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <div className="relative flex-1">
            <Input type="number" min="0.5" max="99" step="0.5" value={value} onChange={(event) => update(index, event.target.value)} placeholder="2" className="pr-24" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">h / semaine</span>
          </div>
          <Button type="button" variant="ghost" size="icon" disabled={!props.allowEmpty && props.values.length === 1} onClick={() => remove(index)}>
            <Trash2 />
            <span className="sr-only">Supprimer cet horaire</span>
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={props.values.length >= 50} onClick={() => props.onChange([...props.values, ''])}>
        <Plus />Ajouter un horaire
      </Button>
    </div>
  )
}
