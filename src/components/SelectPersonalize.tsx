'use client'

import { ChevronDown, type LucideIcon } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type SelectPersonalizeOption<T extends string> = {
  value: T
  label: string
  description: string
  icon: LucideIcon
}

type Props<T extends string> = {
  value: T
  options: SelectPersonalizeOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  triggerClassName?: string
  menuClassName?: string
}

export default function SelectPersonalize<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  align = 'end',
  triggerClassName,
  menuClassName,
}: Props<T>) {
  const option = options.find((item) => item.value === value) ?? options[0]
  const Icon = option.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={[
            'inline-flex min-w-[170px] items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-70',
            triggerClassName ?? '',
          ].join(' ')}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Icon className="h-4 w-4 text-gray-700" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
              <span className="block truncate text-xs text-gray-500">{option.description}</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={['w-[220px] rounded-2xl p-2', menuClassName ?? ''].join(' ')}
      >
        {options.map((item) => {
          const ItemIcon = item.icon
          const active = item.value === value
          return (
            <DropdownMenuItem
              key={item.value}
              onSelect={() => onChange(item.value)}
              className={['rounded-xl px-3 py-3', active ? 'bg-gray-100' : ''].join(' ')}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                  <ItemIcon className="h-4 w-4 text-gray-700" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                  <span className="block text-xs text-gray-500">{item.description}</span>
                </span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
