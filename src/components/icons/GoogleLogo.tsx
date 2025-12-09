// src/components/icons/GoogleLogo.tsx
import React from 'react';

// El SVG del logo de Google (completo con colores)
export const GoogleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    className={props.className || "h-5 w-5"} // Permite pasar clases de Tailwind
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Rojo */}
    <path 
        d="M20.64 12.232c0-.528-.05-1.036-.14-1.528H12.24v2.87h4.72c-.22 1.14-.852 2.1-1.78 2.724l2.454 1.956c1.55-1.442 2.454-3.56 2.454-6.022Z" 
        fill="#4285F4" 
    />
    {/* Azul */}
    <path 
        d="M12.24 20.91c-2.88 0-5.32-.968-7.1-2.61L7.75 16.34c.956.66 2.176 1.05 3.49 1.05 1.488 0 2.76-.402 3.84-1.07l2.45 1.96c-1.75 1.62-4.14 2.59-6.84 2.59Z" 
        fill="#34A853" 
    />
    {/* Amarillo */}
    <path 
        d="M5.14 13.31c-.1-.38-.17-1.16-.17-2.07s.07-1.69.17-2.07l-2.45-1.956c-.53.94-.82 2.05-.82 3.86s.29 3.02.82 3.86l2.45-1.956Z" 
        fill="#FBBC04" 
    />
    {/* Verde */}
    <path 
        d="M12.24 5.37c1.76 0 3.23.636 4.41 1.76l2.16-2.08C17.38 3.01 15.06 2 12.24 2c-4.72 0-8.8 3.51-10.45 8.23l2.45 1.956c.86-2.5 3.26-4.22 6.75-4.22Z" 
        fill="#EA4335" 
    />
  </svg>
);