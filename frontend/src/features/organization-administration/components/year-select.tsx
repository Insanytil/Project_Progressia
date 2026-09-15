import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function YearSelect(props: {
  value: string
  years: string[]
  onValueChange: (value: string) => void
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(value) => props.onValueChange(String(value))}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{props.value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {props.years.map((year) => (
          <SelectItem key={year} value={year}>{year}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
