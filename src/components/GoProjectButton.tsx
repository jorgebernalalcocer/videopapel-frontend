// src/components/LoginButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type GoProjectButtonProps = {
  videoId: number
}

export default function GoProjectButton({ videoId }: GoProjectButtonProps) {
  const router = useRouter()

  const handleProject = () => {
    router.push('/projects')
  }

  return (
    <Button variant="default" onClick={handleProject}>
      Llevar video a projecto
    </Button>
  )
}
