'use client'

import React from 'react'; // Asegúrate de importar React si usas JSX directamente

// Tipado de las props
type DateFormatProps = {
  date?: string | Date;     // Permite string o Date
  isDuplicated?: boolean;
};

/* Componente auxiliar para formatear la fecha con negritas */
export function DateFormat({ date, isDuplicated }: DateFormatProps) {
  if (!date) return null;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };

  // 1. Generar la cadena formateada con locale español
  const formattedString = new Date(date).toLocaleString('es-ES', options);

  // 2. Reestructurar cadena: ejemplo: "18 nov. 2025, 23:51"
  const parts = formattedString.replace(',', '').split(' ');

  const day = parts[0];
  const month = parts[1].replace('.', ''); // eliminar punto de abreviatura
  const year = parts[2].replace(',', '');
  const time = parts[3];

  // 3. Formato final con <strong> en el mes
  const result = (
    <>
      {day} de <strong>{month}</strong> de {year} a las {time} h
    </>
  );

  return (
    <p className="text-xs text-gray-400 mt-1">
      {isDuplicated ? 'Duplicado el día' : 'Creado el día'}: {result}
    </p>
  );
}
