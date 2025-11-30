// src/components/BookLogo.tsx
import React from 'react';
import './BookLogo.css'; // Importamos el CSS para los estilos y animaciones

/**
 * Logo animado que simula un libro abierto con 6 bloques que cambian de color secuencialmente.
 * Imita el estilo del logo proporcionado.
 */
export default function BookLogo() {
  return (
    <div className="book-logo-container" aria-hidden="true">
      {/* Las dos páginas principales del centro */}
      <div className="book-page main-left"></div>
      <div className="book-page main-right"></div>
      
      {/* Las páginas secundarias (exterior izquierda y derecha) */}
      <div className="book-page outer-left-1"></div>
      <div className="book-page outer-right-1"></div>

      {/* Las páginas terciarias (más exteriores izquierda y derecha) */}
      <div className="book-page outer-left-2"></div>
      <div className="book-page outer-right-2"></div>
    </div>
  );
}