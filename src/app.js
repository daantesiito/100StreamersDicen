const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tmi = require('tmi.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const twitchUserName = "daantesiito"; // Nombre de usuario de Twitch
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: twitchUserName,
    password: 'oauth:pd9x7o77sca6oa9mpsdhtc7pxy8kyo' // Token de autenticación de Twitch
  },
  channels: [twitchUserName] // Canal al que se conectará el bot
});

twitchClient.connect();

let answersCount = {};
let activeQuestionIndex = -1;
let timerInterval = null; // Temporizador para el contador de 15 segundos

// Function to start a 15 seconds timer.
const startCountdownTimer = () => {
  let countdown = 0;
  timerInterval = setInterval(() => {
    countdown++;

    if (countdown === 15) {
      twitchClient.say(twitchUserName, '15 segundos restantes!!' ); // Send message to twitch chat.
    }
  }, 1000); 
};

// Function to keep twitch chat messages.
twitchClient.on('message', (channel, tags, message, self) => {
  if (self || activeQuestionIndex === -1) return;
  const word = message.trim().toLowerCase();
  if (answersCount[word]) {
    answersCount[word]++;
  } else {
    answersCount[word] = 1;
  }
  io.emit('chatMessage', { word, count: answersCount[word] });
});

io.on('connection', (socket) => {
  console.log('New Client Connected');

  socket.on('startGame', ({ questionIndex }) => {
    answersCount = {};
    activeQuestionIndex = questionIndex;
    console.log('Recolectando respuestas de pregunta:', questionIndex + 1);

    // Start 15 seconds timer.
    startCountdownTimer();

    // Send message to twitch chat.
    twitchClient.say(twitchUserName, 'Recolectando respuestas! Las 6 mas repetidas se asignaran a la pregunta.');
  });

  socket.on('endGame', ({ questionIndex }) => {
    if (questionIndex === activeQuestionIndex) {
      clearInterval(timerInterval);

      // Sort the answers by quantity and select the 6 most repeated.
      const sortedAnswers = Object.keys(answersCount)
        .map(word => ({ word, count: answersCount[word] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((answer, index) => {
          return {
            word: answer.word,
            points: 600 - (index * 100),
            count: answer.count
          };
        });

      io.emit('showAnswers', { answers: sortedAnswers, questionIndex });
      activeQuestionIndex = -1;
      console.log('Respuestas recolectadas para la pregunta:', questionIndex + 1, sortedAnswers);

      // Send message to twitch chat.
      twitchClient.say(twitchUserName, 'Respuestas recolectadas!!');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server hearing on port: ${PORT}`);
});
