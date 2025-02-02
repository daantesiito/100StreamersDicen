const socket = io();
let timerIntervals = {};
let answersCount = {};
let currentQuestionIndex = 0;

const questions = [
  "Nombra un lugar donde te sorprendería que tu jefe te dijerra que lo acompañes después del trabajo",
  "Amás a tu perro, y hay veces que deseás que tu novix haga QUÉ como tu perro",
  "Si supieras que Chabón está en tu puerta, abrirías la puerta usando ¿que?",
  "Si Argentina tuviese que vender una provincia para pagar deudas, ¿cuál venderías por el mayor precio?",
  "En tus pesadillas, estás desnudx con un hombre/mujer que es idéntico a",
  "Nombrá una parte de tu novix que desees que no está tan malditamente peluda",
  "Yo siempre pensé que sería divertido _____________ desnudo",
  "Nombrá algo que desees que le pase a todos los chicxs que te dejaron",
  "Si estás arreglando una cita a ciegas con Drácula para tu amiga, nombrá algo positivo que dirías de él",
  "Nombrá algo por lo que los hombres estarían dispuestos a ir a prisión para alejarse de ese algo",
  "Decime una señal de tránsito que mejor describa tu vida amorosa",
  "Nombrá un lugar donde un chico muy estúpido podría atascar su dedo",
  "Nombrá algo que un hombre divorciado espera que su ex esposa haga",
  "Tu jefe te dice “andate, estás despedido” ¿Qué hacés antes de salir de la oficina?",
  "Nombrá un disfraz de animal que te gustaría que tu novix use durante el sexo",
  "¿Qué pensás que harías en tu primera cita de divorciado?",
  "Nombrá algo que dejarías que tu novix se salga con la suya haciendolo, pero solo una vez",
  "Nombrá algo que no quieras a menos que sea grande",
  "Si el mundo acabara mañana, ¿en qué gastarías todos tus ahorros hoy?",
  "Mi novix nunca me engañó por que el/ella ama ¿que cosa?",
  "¿En qué provincia de Argentina pensás que encontrarías más esposos que engañen a sus esposas?",
  "Nombrá algo que hace a tu novix llorar",
  "Está mal engañar, pero vas al infierno si lo/a engañás con _______________",
  "Nombrá un oficio/profesión en la que pensás que está lleno de hombres que engañaron a sus esposas",
  "Nombrá algo que tu suegrx tenga más grande que tu novix",
  "Nombrá un país donde un hombre con bigote deba ir para conocer a una mujer con bigote",
  "Nombrá algo que los hombres no hacen tan bien como ellos creen",
  "Nombrá algo que es más atractivo cuando es negro",
  "Nombrá algo que tu novix sería mejor si tomara clases",
  "Si pudieras deshacerte de algo de tu vida por un año ¿qué sería?",
  "Si pudieras cambiar una parte del cuerpo de tu novix ¿cuál sería?",
  "Nombrá algo que harías si tu novix te dice que está embarazada de trillizos",
  "¿Qué harías si estás en la playa y te encontrás con la parte de arriba de un bikini?",
  "Nombrá un animal en la que tu suegrx reencarnaría",
  "Nombrá un lugar donde una persona está feliz de llevar a sus suegros",
  "Si conocés a Chabón, ¿qué le pedirías que autografee?",
  "Nombrá algo que te gusta que tu novix haga con tu cara",
  "A un hombre le podría llegar a caer bien su suegra si tuviera ¿qué?",
  "Nombrá un compañero para practicar besarse",
  "Nombrá una película que describiría tu vida amorosa"
  // Add more questions here
];

const participants = {
  red: document.getElementById('participant-red'),
  yellow: document.getElementById('participant-yellow'),
  green: document.getElementById('participant-green'),
  blue: document.getElementById('participant-blue')
};

const createQuestionElement = (question, index) => {
  const questionContainer = document.createElement('div');
  questionContainer.classList.add('question-container');
  if (index === 0) {
    questionContainer.classList.add('current-question');
  }

  const questionTitle = document.createElement('h2');
  questionTitle.textContent = `Pregunta ${index + 1}: ${question}`;
  questionContainer.appendChild(questionTitle);

  const timer = document.createElement('div');
  timer.classList.add('timer');
  timer.id = `timer-${index}`;
  timer.textContent = "Time: 30";
  questionContainer.appendChild(timer);

  const answersDiv = document.createElement('div');
  answersDiv.classList.add('answers');
  for (let i = 1; i <= 6; i++) {
    const answerContainer = document.createElement('div');
    answerContainer.classList.add('answer-container');

    const answerDiv = document.createElement('div');
    answerDiv.classList.add('answer');
    answerDiv.dataset.points = 600 - (i - 1) * 100;
    answerDiv.dataset.revealed = "false";
    answerDiv.id = `answer-${index}-${i}`;
    answerDiv.textContent = "???";
    answerContainer.appendChild(answerDiv);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('buttons');
    const buttonTexts = {
      red: 'Aldu',
      yellow: 'Flor',
      green: 'Joaco',
      blue: 'Baulo'
    };
    ['red', 'yellow', 'green', 'blue'].forEach(color => {
      const button = document.createElement('button');
      button.classList.add('reveal-button');
      button.dataset.color = color;
      button.dataset.answer = i;
      button.dataset.question = index;
      button.textContent = buttonTexts[color];
      button.addEventListener('click', () => {
        revealAnswer(index, i, color);
      });
      buttonsDiv.appendChild(button);
    });

    // Add gray button
    const grayButton = document.createElement('button');
    grayButton.classList.add('reveal-button');
    grayButton.style.backgroundColor = 'gray';
    grayButton.textContent = 'Reveal';
    grayButton.addEventListener('click', () => {
      revealAnswer(index, i, 'none');
    });
    buttonsDiv.appendChild(grayButton);

    answerContainer.appendChild(buttonsDiv);
    answersDiv.appendChild(answerContainer);
  }

  questionContainer.appendChild(answersDiv);
  return questionContainer;
};

const startGame = (questionIndex) => {
  socket.emit('startGame', { questionIndex });
  startTimer(30, questionIndex);
};

const startTimer = (duration, questionIndex) => {
  let timer = duration;
  timerIntervals[questionIndex] = setInterval(() => {
    let minutes = parseInt(timer / 60, 10);
    let seconds = parseInt(timer % 60, 10);

    seconds = seconds < 10 ? "0" + seconds : seconds;

    document.getElementById(`timer-${questionIndex}`).textContent = `Time: ${minutes}:${seconds}`;

    if (--timer < 0) {
      clearInterval(timerIntervals[questionIndex]);
      socket.emit('endGame', { questionIndex });
    }
  }, 1000);
};

const revealAnswer = (questionIndex, answerIndex, color) => {
  const answerElement = document.getElementById(`answer-${questionIndex}-${answerIndex}`);

  if (answerElement.dataset.revealed === "false") {
    answerElement.textContent = answerElement.dataset.word;
    if (color !== 'none') {
      answerElement.style.backgroundColor = color;
    }
    answerElement.dataset.revealed = "true";

    if (color !== 'none') {
      const points = parseInt(answerElement.dataset.points, 10);
      const participantElement = document.getElementById(`participant-${color}`);
      const currentScore = parseInt(participantElement.textContent.split(': ')[1], 10);
      participantElement.textContent = `${participantElement.textContent.split(': ')[0]}: ${currentScore + points}`;
    }

    document.querySelectorAll(`.reveal-button[data-question="${questionIndex}"][data-answer="${answerIndex}"]`).forEach(button => {
      button.disabled = true;
    });
  }
};


const showRedX = (questionContainer) => {
  let redX = questionContainer.querySelector('.red-x');

  if (!redX) {
    redX = document.createElement('div');
    redX.classList.add('red-x');
    redX.textContent = 'X';
    questionContainer.appendChild(redX);
  }

  redX.style.display = 'block';

  setTimeout(() => {
    redX.style.display = 'none';
  }, 2000);
};

const showNextQuestion = () => {
  const currentQuestion = document.querySelector('.current-question');
  if (currentQuestion) {
    currentQuestion.classList.remove('current-question');
  }
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    const nextQuestion = document.querySelector(`.question-container:nth-child(${currentQuestionIndex + 1})`);
    if (nextQuestion) {
      nextQuestion.classList.add('current-question');
    }
  } else {
    document.getElementById('next-button').style.display = 'none';
  }
};

socket.on('chatMessage', ({ word, count }) => {
  answersCount[word] = count;
});

socket.on('showAnswers', ({ answers, questionIndex }) => {
  answers.forEach((answer, index) => {
    const answerElement = document.getElementById(`answer-${questionIndex}-${index + 1}`);
    answerElement.dataset.word = answer.word;
    answerElement.dataset.points = answer.points;
    answerElement.dataset.revealed = "false";
    answerElement.textContent = "???";
    answerElement.style.backgroundColor = "white";
  });
});

document.getElementById('start-button').addEventListener('click', () => startGame(currentQuestionIndex));
document.getElementById('x-button').addEventListener('click', () => showRedX(document.querySelector('.current-question')));
document.getElementById('next-button').addEventListener('click', showNextQuestion);

// Initialize questions
questions.forEach((question, index) => {
  const questionElement = createQuestionElement(question, index);
  document.getElementById('questions-container').appendChild(questionElement);
});

document.getElementById('next-button').style.display = 'block'; // Ensure the next button is visible
