'use client'

import { Button } from "@/components/ui/button"

export default function RegisterButton() {
  const handleRegister = () => {
    window.location.href = "/register"
  }

  return (
    <Button variant="default" onClick={handleRegister}>
      Registrarse
    </Button>
  )
}
