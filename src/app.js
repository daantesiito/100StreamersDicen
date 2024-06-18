const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tmi = require('tmi.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const twitchUserName = "your-twitch-username"; // Nombre de usuario de Twitch
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: twitchUserName,
    password: 'oauth:your-auth-token' // Token de autenticación de Twitch
  },
  channels: ['channel-to-connect'] // Canal al que se conectará el bot
});

twitchClient.connect();

let answersCount = {};
let activeQuestionIndex = -1;
let timerInterval = null; // Temporizador para el contador de 15 segundos

// Función para iniciar el temporizador de 15 segundos
const startCountdownTimer = () => {
  let countdown = 0;
  timerInterval = setInterval(() => {
    countdown++;

    // Cuando han pasado 15 segundos (15000 milisegundos), enviamos el mensaje al chat de Twitch
    if (countdown === 15) {
      twitchClient.say(twitchUserName, '15 seconds remaining!!' );
    }
  }, 1000); // Intervalo de 1 segundo
};

// Escuchar mensajes del chat de Twitch
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
    console.log('Game started to Question number:', questionIndex + 1);

    // Iniciar el temporizador de 15 segundos
    startCountdownTimer();

    // Enviamos el mensaje al chat de Twitch
    twitchClient.say(twitchUserName, 'Gathering responses! You have 30 seconds to type your answer in the chat, and the 6 most repeated ones will be assigned!');
  });

  socket.on('endGame', ({ questionIndex }) => {
    if (questionIndex === activeQuestionIndex) {
      clearInterval(timerInterval); // Limpiar el temporizador si el juego ha terminado

      // Ordenar las respuestas por cantidad y seleccionar las 6 más repetidas
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

      // Emitir las respuestas ordenadas al cliente
      io.emit('showAnswers', { answers: sortedAnswers, questionIndex });
      activeQuestionIndex = -1;
      console.log('Game ended to Question number:', questionIndex + 1, sortedAnswers);

      // Enviamos el mensaje al chat de Twitch
      twitchClient.say(twitchUserName, 'Answers asigned. Stop spamming!!');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server hearing on port: ${PORT}`);
});
