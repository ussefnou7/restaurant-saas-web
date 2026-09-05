import { DatePicker, type DatePickerProps } from './DatePicker'

export type DateFilterProps = DatePickerProps

export function DateFilter(props: DateFilterProps) {
  return <DatePicker size="toolbar" {...props} />
}
