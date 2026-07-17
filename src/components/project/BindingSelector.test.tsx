import BindingSelector from './BindingSelector'
import { runRadioSelectorSuite } from '@/test/selectorHarness'

runRadioSelectorSuite({
  name: 'BindingSelector',
  Component: BindingSelector,
  options: [
    { id: 1, name: 'Alpha', description: 'Grapada' },
    { id: 2, name: 'Beta', description: 'Cosida' },
  ],
  labelKey: 'name',
  getUrlIncludes: '/print-bindings/',
  patchUrlIncludes: '/projects/p1/print-binding/',
  patchField: 'print_binding_id',
})
