export const TUTORIAL_KEY = "mi-apiario:tutorial-v2";

export const TUTORIAL_STEPS = [
  {
    title: "Bienvenido a Mi Apiario",
    body: "Mi Apiario es un cuaderno apícola digital, gratuito y pensado para ayudarte a organizar el trabajo diario desde el móvil o el ordenador. Está en fase de evaluación y tus sugerencias ayudan a mejorarla.",
  },
  {
    title: "Crea tus apiarios",
    body: "Empieza registrando cada ubicación o asentamiento. Dentro de cada apiario podrás organizar las colmenas y los núcleos y consultar sus fichas.",
  },
  {
    title: "Registra revisiones y tareas",
    body: "Usa las fichas para mantener el historial de tus colonias y organizar el trabajo pendiente. Las tareas te ayudan a recordar qué debes revisar y cuándo.",
  },
  {
    title: "Controla la sanidad",
    body: "Registra tratamientos y observaciones sanitarias, incluidos los controles de varroa. Anota las fechas y los detalles para mantener un historial útil de cada colonia.",
  },
  {
    title: "Anota la producción y consulta el histórico",
    body: "Registra la cosecha y los datos de producción, y consulta la información histórica para tener una visión más ordenada de cada temporada.",
  },
  {
    title: "Cuida tus datos y comparte la aplicación",
    body: "Los datos se guardan en este dispositivo y no se sincronizan automáticamente con otros equipos. En Datos puedes crear una copia de seguridad JSON. Guárdala en un lugar seguro. Puedes compartir Mi Apiario con otros apicultores por WhatsApp.",
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
