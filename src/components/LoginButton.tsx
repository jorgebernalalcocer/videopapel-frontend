'use client'

import { Button } from "@/components/ui/button"

export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = "/login"
  }

  return (
    <Button variant="secondary" onClick={handleLogin}>
      Iniciar sesión
    </Button>
  )
}
