const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./messageModel');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const dbUrl =
  'mongodb+srv://iriscafe:iriscafe@cluster0.uzqlaev.mongodb.net/?retryWrites=true&w=majority';

const respostasAutomaticas = {
  'oi': 'Oi! Como posso ajudar você?',
  'olá': 'Olá! Como posso ajudar você?',
  'salve': 'Salve! Como posso ajudar você?',
  'como está': 'Estou bem, obrigado! E você?',
  'tchau': 'Até mais! Se precisar de algo, estou aqui.',
  'ajuda': 'Claro, estou aqui para ajudar. O que você precisa?',
  'quem é você': 'Eu sou um assistente virtual. Como posso ajudar você hoje?',
  'novidades': 'Atualmente não tenho novidades. Posso ajudar com mais alguma coisa?',
  'obrigado': 'De nada! Se precisar de mais alguma coisa, é só chamar.'
};

app.post('/messages', async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase();
    const message = new Message(req.body);
    const savedMessage = await message.save();

    console.log('Message saved');

    const censored = await Message.findOne({ message: 'badword' });
    if (censored) {
      await Message.deleteOne({ _id: censored.id });
    } else {
      io.emit('message', req.body);
      checkAndRespond(userMessage);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error posting message:', error);
    res.sendStatus(500);
  } finally {
    console.log('Message Posted');
  }
});

function checkAndRespond(userMessage) {
  for (const keyword in respostasAutomaticas) {
    if (userMessage.includes(keyword)) {
      const appResponse = {
        name: 'My App',
        message: respostasAutomaticas[keyword],
      };
      io.emit('message', appResponse);
      saveAutoResponse(appResponse);
      break;
    }
  }
}

async function saveAutoResponse(response) {
  try {
    const autoResponseMessage = new Message({
      name: response.name,
      message: response.message,
    });
    await autoResponseMessage.save();
    console.log('Auto response saved');
  } catch (error) {
    console.error('Error saving auto response:', error);
  }
}

io.on('connection', () => { 
  console.log('A user is connected');
});

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
