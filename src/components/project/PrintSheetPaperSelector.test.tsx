import PrintSheetPaperSelector from './PrintSheetPaperSelector'
import { runRadioSelectorSuite } from '@/test/selectorHarness'

runRadioSelectorSuite({
  name: 'PrintSheetPaperSelector',
  Component: PrintSheetPaperSelector,
  options: [
    { id: 1, label: 'Alpha', weight: 120, finishing: 'Mate' },
    { id: 2, label: 'Beta', weight: 250, finishing: 'Brillo' },
  ],
  labelKey: 'label',
  getUrlIncludes: '/print-sheet-papers/',
  patchUrlIncludes: '/projects/p1/print-sheet-paper/',
  patchField: 'print_sheet_paper_id',
})
