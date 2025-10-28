'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
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
export default function SelectableBadgeWrapper<T extends object, U extends { className?: string }>({
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
  selectorProps: U | ((helpers: { closeModal: () => void }) => U)
  
  // Customización del Modal
  modalTitle: ReactNode
  modalDescription: ReactNode
  modalProps?: Partial<Omit<ModalProps, 'open' | 'onClose' | 'children'>>
}) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  const resolvedSelectorProps = useMemo<U>(() => {
    return typeof selectorProps === 'function'
      ? (selectorProps as (helpers: { closeModal: () => void }) => U)({ closeModal })
      : selectorProps
  }, [selectorProps, closeModal])
  const selectorPropsWithClassName = useMemo(() => {
    const mergedClassName = ['mt-4', resolvedSelectorProps.className].filter(Boolean).join(' ')
    return {
      ...resolvedSelectorProps,
      className: mergedClassName,
    } as U
  }, [resolvedSelectorProps])

  // El Badge se envuelve en un div cliqueable.
  const badgeElement = useMemo(() => (
    <button
      type="button"
      onClick={openModal}
      className="inline-block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <BadgeComponent {...badgeProps} />
    </button>
  ), [BadgeComponent, badgeProps, openModal])

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
        <SelectorComponent {...selectorPropsWithClassName} />
      </Modal>
    </>
  )
}
