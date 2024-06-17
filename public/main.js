const socket = io();
let timerIntervals = {};
let answersCount = {};
let currentQuestionIndex = 0;

const questions = [
  "¿Cuáles son las partes más conocidas de un barco?",
  "¿Cuál es tu comida favorita?",
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
      red: 'Participant1',
      yellow: 'Participant2',
      green: 'Participant3',
      blue: 'Participant4'
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
