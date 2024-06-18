const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tmi = require('tmi.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const twitchUserName = "your-twitch-username"; //  <-- CHANGE / Twitch Username
const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: twitchUserName,
    password: 'oauth:your-auth-token' //  <-- CHANGE / Twitch Token Authentication
  },
  channels: ['twitch-channel-to-connect'] //  <-- CHANGE / Twitch Channel that the bot will connect
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
      twitchClient.say(twitchUserName, '15 seconds remaining!!' ); // Send message to twitch chat.
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
    console.log('Game started to Question number:', questionIndex + 1);

    // Start 15 seconds timer.
    startCountdownTimer();

    // Send message to twitch chat.
    twitchClient.say(twitchUserName, 'Gathering responses! You have 30 seconds to type your answer in the chat, and the 6 most repeated ones will be assigned!');
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
      console.log('Game ended to Question number:', questionIndex + 1, sortedAnswers);

      // Send message to twitch chat.
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
