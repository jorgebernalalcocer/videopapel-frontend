import SizeSelector from './SizeSelector'
import { runRadioSelectorSuite } from '@/test/selectorHarness'

runRadioSelectorSuite({
  name: 'SizeSelector',
  Component: SizeSelector,
  options: [
    { id: 1, label: 'Alpha', width_mm: 210, height_mm: 297 },
    { id: 2, label: 'Beta', width_mm: 100, height_mm: 150 },
  ],
  labelKey: 'label',
  getUrlIncludes: '/print-sizes/',
  patchUrlIncludes: '/projects/p1/print-size/',
  patchField: 'print_size_id',
})
