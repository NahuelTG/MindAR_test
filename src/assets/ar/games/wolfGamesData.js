// src/assets/ar/games/wolfGamesData.js

export const wolfGamesData = {
  0: {
    // Primera animación - Quiz de Naturaleza
    type: 'quiz',
    title: '🌲 Quiz de la Naturaleza',
    description: 'El lobo te desafía con preguntas sobre la naturaleza',
    questions: [
      {
        question: '¿Cuál es el hábitat natural de los lobos?',
        options: ['Desierto', 'Bosque y tundra', 'Océano', 'Selva tropical'],
        correct: 1,
        explanation: 'Los lobos viven principalmente en bosques, tundras y montañas del hemisferio norte.',
      },
      {
        question: '¿Cómo se llama un grupo de lobos?',
        options: ['Manada', 'Rebaño', 'Bandada', 'Cardumen'],
        correct: 0,
        explanation: 'Una manada de lobos está liderada por los alfas y puede tener de 2 a 30 miembros.',
      },
      {
        question: '¿Qué sentido tienen más desarrollado los lobos?',
        options: ['Vista', 'Olfato', 'Oído', 'Tacto'],
        correct: 1,
        explanation: 'Los lobos pueden oler a su presa desde más de 2 kilómetros de distancia.',
      },
      {
        question: '¿Cuántas especies de lobos existen?',
        options: ['1', '3', '5', '7'],
        correct: 1,
        explanation: 'Existen tres especies principales: lobo gris, lobo rojo y lobo etíope.',
      },
      {
        question: '¿Los lobos son carnívoros o omnívoros?',
        options: ['Carnívoros', 'Omnívoros', 'Herbívoros', 'Insectívoros'],
        correct: 1,
        explanation: 'Aunque son principalmente carnívoros, también comen frutas, bayas y vegetales.',
      },
    ],
  },

  1: {
    // Segunda animación - Juego de Palabras
    type: 'wordGame',
    title: '🔤 Formando Palabras Salvajes',
    description: 'Forma palabras relacionadas con lobos y naturaleza',
    challenges: [
      {
        scrambled: 'BANOM',
        answer: 'MANBA',
        hint: 'Serpiente venenosa',
        category: 'animales',
      },
      {
        scrambled: 'QUESOB',
        answer: 'BOSQUE',
        hint: 'Hogar de muchos animales salvajes',
        category: 'naturaleza',
      },
      {
        scrambled: 'ULLIDO',
        answer: 'AULLIDO',
        hint: 'Sonido característico del lobo',
        category: 'sonidos',
      },
      {
        scrambled: 'CAZADOR',
        answer: 'CAZADOR',
        hint: 'Quien busca presas en la naturaleza',
        category: 'roles',
      },
      {
        scrambled: 'INSTINTO',
        answer: 'INSTINTO',
        hint: 'Comportamiento natural innato',
        category: 'comportamiento',
      },
    ],
  },

  2: {
    // Tercera animación - Memoria Visual
    type: 'memory',
    title: '🧠 Memoria del Alfa',
    description: 'Memoriza la secuencia como un líder de la manada',
    sequences: [
      {
        pattern: ['🐺', '🌙', '🏔️'],
        story: 'El lobo aúlla a la luna desde la montaña',
      },
      {
        pattern: ['🐺', '🦌', '🌲', '💨'],
        story: 'El lobo caza al ciervo entre los árboles velozmente',
      },
      {
        pattern: ['🌕', '🐺', '👥', '🏞️', '🔥'],
        story: 'En luna llena, la manada se reúne en el valle alrededor del fuego',
      },
      {
        pattern: ['❄️', '🐺', '🐾', '🏠', '🌨️'],
        story: 'En invierno, el lobo sigue las huellas hacia refugio durante la tormenta',
      },
    ],
  },

  3: {
    // Cuarta animación - Asociación de Sonidos
    type: 'soundMatch',
    title: '🎵 Sonidos de la Naturaleza',
    description: 'Asocia cada sonido con su descripción',
    sounds: [
      {
        emoji: '🌊',
        sound: 'Splash',
        description: 'Sonido del agua corriendo',
        options: ['Río', 'Fuego', 'Viento', 'Lluvia'],
        correct: 0,
      },
      {
        emoji: '🦉',
        sound: 'Huu-huu',
        description: 'Sonido nocturno del bosque',
        options: ['Lobo', 'Búho', 'Murciélago', 'Grillo'],
        correct: 1,
      },
      {
        emoji: '🔥',
        sound: 'Crack-pop',
        description: 'Sonido cálido y crepitante',
        options: ['Agua', 'Viento', 'Fuego', 'Hojas'],
        correct: 2,
      },
      {
        emoji: '🌬️',
        sound: 'Whoosh',
        description: 'Sonido que mueve las hojas',
        options: ['Trueno', 'Viento', 'Animal', 'Piedra'],
        correct: 1,
      },
    ],
  },

  4: {
    // Quinta animación - Estrategia de Caza
    type: 'strategy',
    title: '🎯 Estrategia de Caza',
    description: 'Planifica la caza como un verdadero depredador',
    scenarios: [
      {
        situation: 'Un ciervo está bebiendo agua en el río',
        terrain: 'bosque_denso',
        options: [
          'Atacar directamente desde el frente',
          'Rodear silenciosamente desde sotavento',
          'Esperar a que se aleje del agua',
          'Hacer ruido para asustarlo',
        ],
        correct: 1,
        explanation: 'Acercarse desde sotavento evita que el ciervo detecte tu olor',
      },
      {
        situation: 'Una manada de alces cruzando un valle abierto',
        terrain: 'valle_abierto',
        options: ['Atacar al más fuerte del grupo', 'Separar al más débil o joven', 'Atacar a todos a la vez', 'Esperar en el mismo lugar'],
        correct: 1,
        explanation: 'Los lobos siempre buscan separar a la presa más vulnerable',
      },
      {
        situation: 'Rastros frescos en la nieve llevando hacia una cueva',
        terrain: 'montaña_nevada',
        options: [
          'Seguir los rastros inmediatamente',
          'Verificar si hay otros depredadores',
          'Dar la vuelta por otro camino',
          'Marcar territorio aquí',
        ],
        correct: 1,
        explanation: 'Un lobo inteligente siempre evalúa los riesgos antes de actuar',
      },
    ],
  },
}

export const getGameByAnimation = (animationIndex) => {
  return wolfGamesData[animationIndex] || null
}

export const getGameTypes = () => {
  return {
    quiz: 'Preguntas y Respuestas',
    wordGame: 'Juego de Palabras',
    memory: 'Memoria Visual',
    soundMatch: 'Asociación de Sonidos',
    strategy: 'Estrategia',
  }
}
