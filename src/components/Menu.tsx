import { Button } from "@/components/ui/button"
import LoginButton from "@/components/LoginButton"
import RegisterButton from "@/components/RegisterButton"

export default function Menu() {
  return (
    <header className="bg-blue-400 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">VideoPapel</h1>
      <nav className="space-x-4">
        <a href="#" className="hover:underline">Inicio</a>
        <a href="#" className="hover:underline">Productos</a>
        <a href="#" className="hover:underline">Contacto</a>
                <LoginButton />
                <RegisterButton />
                      </nav>
    </header>
  );
}
