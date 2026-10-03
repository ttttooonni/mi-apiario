import type { QueenColor } from "./types";

/**
 * Código internacional de marcado de reinas.
 * Se usa el año de introducción (o nacimiento) y el último dígito:
 *
 *   1 y 6 → blanco
 *   2 y 7 → amarillo
 *   3 y 8 → rojo
 *   4 y 9 → verde
 *   5 y 0 → azul
 *
 * Ciclo de cinco colores, convención usada internacionalmente.
 * El color NUNCA lo elige el usuario: se calcula a partir del año.
 */
export function queenColorForYear(year: number): QueenColor {
  const digit = ((year % 10) + 10) % 10;
  if (digit === 1 || digit === 6) return "white";
  if (digit === 2 || digit === 7) return "yellow";
  if (digit === 3 || digit === 8) return "red";
  if (digit === 4 || digit === 9) return "green";
  return "blue";
}

export function queenColorFromDate(isoDate: string): QueenColor {
  const year = Number.parseInt(isoDate.slice(0, 4), 10);
  if (!Number.isFinite(year)) return queenColorForYear(new Date().getFullYear());
  return queenColorForYear(year);
}

export const QUEEN_COLOR_META: Record<
  QueenColor,
  { label: string; fill: string; stroke: string; onFill: string }
> = {
  white: {
    label: "Blanco",
    fill: "#F4F1E8",
    stroke: "#8A8376",
    onFill: "#1F1A14",
  },
  yellow: {
    label: "Amarillo",
    fill: "#D4A017",
    stroke: "#8A6A0A",
    onFill: "#1F1A14",
  },
  red: {
    label: "Rojo",
    fill: "#B83A2A",
    stroke: "#7A241C",
    onFill: "#FAF7F0",
  },
  green: {
    label: "Verde",
    fill: "#2F7A4A",
    stroke: "#1C4F30",
    onFill: "#FAF7F0",
  },
  blue: {
    label: "Azul",
    fill: "#2B5A9A",
    stroke: "#1A3C6B",
    onFill: "#FAF7F0",
  },
};

export const QUEEN_COLOR_CYCLE: { digits: string; color: QueenColor }[] = [
  { digits: "1 y 6", color: "white" },
  { digits: "2 y 7", color: "yellow" },
  { digits: "3 y 8", color: "red" },
  { digits: "4 y 9", color: "green" },
  { digits: "5 y 0", color: "blue" },
];
