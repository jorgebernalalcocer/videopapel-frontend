'use client'

import React from 'react'; // Asegúrate de importar React si usas JSX directamente

{/* Componente auxiliar para formatear la fecha con negritas */}
export function DateFormat({ date, isDuplicated }) {
  if (!date) return null;

  const options = {
    year: 'numeric',
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h23', 
  };

  // 1. Generar la cadena formateada (e.g., "18 nov. 2025, 23:51")
  // Usamos el locale 'es-ES' para el formato en español
  const formattedString = new Date(date).toLocaleString('es-ES', options);

  // 2. Reestructurar la cadena para el formato deseado
  // Ej: "18 nov. 2025, 23:51" -> ["18", "nov.", "2025,", "23:51"]
  const parts = formattedString.replace(',', '').split(' ');

  const day = parts[0];
  const month = parts[1].replace('.', ''); // Eliminar el punto de abreviatura
  const year = parts[2].replace(',', '');
  const time = parts[3];

  // 3. Unir las partes con el formato deseado, APLICANDO <strong> AL MES
  const result = (
    <>
      {day} de <strong>{month}</strong> de {year} a las {time} h
    </>
  );

  return (
    <p className="text-xs text-gray-400 mt-1">
      {isDuplicated ? "Duplicado el día" : "Creado el día"}: {result}
    </p>
  );
}