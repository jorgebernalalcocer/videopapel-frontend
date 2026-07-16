import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectEditorGate from './ProjectEditorGate'
import { useAuth } from '@/store/auth'

// ProjectEditor es enorme y hace data-loading; lo sustituimos por un stub
vi.mock('@/components/project/ProjectEditor', () => ({
  default: ({ projectId }: { projectId: string }) => (
    <div data-testid="project-editor">editor:{projectId}</div>
  ),
}))

const notFound = vi.fn(() => null)
vi.mock('next/navigation', () => ({
  notFound: () => notFound(),
}))

beforeEach(() => {
  notFound.mockClear()
  useAuth.setState({ hasHydrated: false, accessToken: null, refreshToken: null, user: null })
})

describe('ProjectEditorGate', () => {
  it('muestra "Preparando..." mientras el store no ha hidratado', () => {
    useAuth.setState({ hasHydrated: false })
    render(<ProjectEditorGate projectId="p1" />)
    expect(screen.getByText('Preparando...')).toBeInTheDocument()
    expect(screen.queryByTestId('project-editor')).not.toBeInTheDocument()
  })

  it('pide iniciar sesión si está hidratado, sin token y sin acceso anónimo', () => {
    useAuth.setState({ hasHydrated: true, accessToken: null })
    render(<ProjectEditorGate projectId="p1" />)
    expect(screen.getByText('Inicia sesión para ver este proyecto.')).toBeInTheDocument()
    expect(screen.queryByTestId('project-editor')).not.toBeInTheDocument()
  })

  it('renderiza el editor cuando hay token', () => {
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' })
    render(<ProjectEditorGate projectId="p42" />)
    expect(screen.getByTestId('project-editor')).toHaveTextContent('editor:p42')
  })

  it('renderiza el editor sin token si allowAnonymous', () => {
    useAuth.setState({ hasHydrated: true, accessToken: null })
    render(<ProjectEditorGate projectId="p7" allowAnonymous />)
    expect(screen.getByTestId('project-editor')).toBeInTheDocument()
  })

  it('llama a notFound cuando falta el projectId', () => {
    render(<ProjectEditorGate projectId="" />)
    expect(notFound).toHaveBeenCalled()
    expect(screen.queryByTestId('project-editor')).not.toBeInTheDocument()
  })
})
