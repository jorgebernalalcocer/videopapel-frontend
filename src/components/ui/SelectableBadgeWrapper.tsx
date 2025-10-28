'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { Modal, type ModalProps } from './Modal'

/**
 * Componente de alto orden que envuelve un Badge (visualizador)
 * y lo convierte en un elemento cliqueable que abre un modal,
 * dentro del cual se renderiza un Selector (lógica de selección/API).
 * * @param BadgeComponent El componente de React que muestra el estado actual (e.g., PrintQualityBadge).
 * @param SelectorComponent El componente de React que maneja la lógica de selección y guardado (e.g., QualitySelector).
 * @param badgeProps Las props que se pasan al BadgeComponent.
 * @param selectorProps Las props que se pasan al SelectorComponent (incluyendo la lógica de API).
 */
export default function SelectableBadgeWrapper<T extends object, U extends object>({
  BadgeComponent,
  SelectorComponent,
  badgeProps,
  selectorProps,
  modalTitle,
  modalDescription,
  modalProps,
}: {
  // Componentes
  BadgeComponent: React.ComponentType<T>
  SelectorComponent: React.ComponentType<U>
  
  // Props
  badgeProps: T
  selectorProps: U
  
  // Customización del Modal
  modalTitle: ReactNode
  modalDescription: ReactNode
  modalProps?: Partial<Omit<ModalProps, 'open' | 'onClose' | 'children'>>
}) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  // El Badge se envuelve en un div cliqueable.
  const badgeElement = useMemo(() => (
    <div 
      onClick={openModal} 
      className="cursor-pointer inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full" // Añadimos focus state para accesibilidad
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openModal()
          e.preventDefault()
        }
      }}
    >
      <BadgeComponent {...badgeProps} />
    </div>
  ), [BadgeComponent, badgeProps])

  return (
    <>
      {/* 1. Renderizar el Badge cliqueable */}
      {badgeElement}

      {/* 2. Renderizar el Modal con el Selector dentro */}
      <Modal
        open={isOpen}
        onClose={closeModal}
        title={modalTitle}
        description={modalDescription}
        size="sm" // Pequeño por defecto para selectores
        {...modalProps}
      >
        {/* Renderizar el selector con sus props */}
        {/* Le damos una pequeña clase de margen para separarlo del título del modal */}
        <SelectorComponent {...selectorProps} className="mt-4" />
      </Modal>
    </>
  )
}
