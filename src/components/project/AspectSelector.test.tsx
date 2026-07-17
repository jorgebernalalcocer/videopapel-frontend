import AspectSelector from './AspectSelector'
import { runRadioSelectorSuite } from '@/test/selectorHarness'

runRadioSelectorSuite({
  name: 'AspectSelector',
  Component: AspectSelector,
  options: [
    { id: 1, name: 'Alpha', slug: 'fill', description: 'Rellena' },
    { id: 2, name: 'Beta', slug: 'fit', description: 'Adapta' },
  ],
  labelKey: 'name',
  getUrlIncludes: '/print-aspects/',
  patchUrlIncludes: '/projects/p1/print-aspect/',
  patchField: 'print_aspect_id',
})
