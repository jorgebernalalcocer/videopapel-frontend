import QualitySelector from './QualitySelector'
import { runRadioSelectorSuite } from '@/test/selectorHarness'

runRadioSelectorSuite({
  name: 'QualitySelector',
  Component: QualitySelector,
  options: [
    { id: 1, name: 'Alpha', dpi: 150 },
    { id: 2, name: 'Beta', dpi: 300 },
  ],
  labelKey: 'name',
  getUrlIncludes: '/print-qualities/',
  patchUrlIncludes: '/projects/p1/print-quality/',
  patchField: 'print_quality_id',
})
