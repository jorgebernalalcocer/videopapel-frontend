'use client'

import { Modal } from '@/components/ui/Modal'

type LockDeleteFrameLowDensityProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  maxDensity: number
}

export default function LockDeleteFrameLowDensity({
  open,
  onClose,
  onConfirm,
  maxDensity,
}: LockDeleteFrameLowDensityProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Aumenta la densidad a ${maxDensity} fotos/s`}

      footer={
        <>
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-yellow-500 text-sm font-semibold text-white hover:bg-yellow-600"
            onClick={onConfirm}
          >
            {`Cambiar a ${maxDensity}`}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-700">
        {`Para borrar fotogramás debes de cambiar la densidad de fotos a ${maxDensity} por segundo.`}
      </p>
      <p className="text-sm text-gray-700">
        {`Después de borrar, podrás volver a una densidad menor a ${maxDensity}.`}
      </p>
    </Modal>
  )
}
