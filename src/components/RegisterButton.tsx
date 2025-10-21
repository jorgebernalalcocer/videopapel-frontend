'use client'

import { Button } from "@/components/ui/button"

export default function LoginButton() {
  const handleRegister = () => {
    window.location.href = "/register"
  }

  return (
    <Button variant="default" onClick={handleRegister}>
      Registrarse
    </Button>
  )
}
