export const TUTORIAL_KEY = "mi-apiario:tutorial-v3";

export const TUTORIAL_STEPS = [
  {
    title: "Bienvenido a Mi Apiario",
    body: "Es un cuaderno para organizar tu explotación apícola: apiarios, colmenas, núcleos, tareas, sanidad, producción e histórico. Está pensado para usarlo en el móvil. Los datos se guardan en este dispositivo; antes de salir sin cobertura, abre la app y comprueba que puedes entrar en las pantallas que vas a necesitar.",
  },
  {
    title: "La pantalla de inicio",
    body: "Aquí tienes un resumen: cuántos apiarios, colmenas y núcleos hay, la producción del año y las tareas pendientes. Si algo queda pendiente, puedes entrar en la tarea o en la colonia correspondiente.",
  },
  {
    title: "Apiarios y ficha de colonia",
    body: "En «Apiarios» eliges el apiario y después la colmena o el núcleo. En su ficha consulta los datos y añade acciones con fecha y observaciones. Mantén los números claros para localizar cada colonia durante la visita.",
  },
  {
    title: "Anota lo que haces",
    body: "Registra una revisión, un cambio de material, un traslado, una cosecha o una nota cuando ocurra. Cada acción queda vinculada a su colonia y se conserva en su historial. Anotar una sola vez no debe sustituir el historial de las demás colonias.",
  },
  {
    title: "Alimentación: solo cuando haga falta",
    body: "La alimentación es una acción propia, independiente de Sanidad. Se usa cuando las condiciones y reservas lo aconsejan, no como tarea rutinaria durante todo el año. Indica el alimento, la cantidad por colonia, la fecha y una nota si ayuda a recordar el motivo.",
  },
  {
    title: "Acciones en cascada",
    body: "Ejemplo: tienes 20 colonias y hoy alimentas 8. En «Acciones del apiario», selecciona esas 8, elige «Alimentación» y registra los datos una sola vez. La app guarda 8 acciones individuales, una en el historial de cada colonia. Las otras 12 pueden quedar como tareas pendientes si activas esa opción.",
  },
  {
    title: "Sanidad y tratamientos",
    body: "Usa «Sanidad» para controles, observaciones y tratamientos sanitarios, por ejemplo los relacionados con varroa. No registres la alimentación como si fuera un tratamiento: son cosas distintas y deben consultarse por separado.",
  },
  {
    title: "Histórico y producción",
    body: "El histórico te permite consultar qué se registró, en qué colonia y en qué fecha. La producción se anota por producto y lote en su apartado. Revisa el historial si necesitas recordar qué se recomendó, qué hiciste y cuándo.",
  },
  {
    title: "Copias, restauración y actualizaciones",
    body: "En «Datos» descarga regularmente una copia JSON y guárdala fuera del móvil. Para restaurar, selecciona una copia válida: sustituirá los datos actuales por los de ese archivo, así que conserva siempre la copia más reciente. Las actualizaciones de la app no deben borrar el cuaderno. En Android, iPhone o iPad, vuelve a abrir la aplicación con conexión y pulsa «Actualizar» si aparece el aviso; después comprueba que tus datos siguen ahí.",
  },
] as const;

export function hasSeenTutorial(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return true;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    /* private mode */
  }
}
