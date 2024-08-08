const express = require('express');
const { createServer } = require('node:http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');
const multer = require('multer');
const app = express();
const server = createServer(app);
const cors = require('cors');
app.use(express.static(path.join(__dirname, 'public')));
const io = new Server(server,{
    connectionStateRecovery: {},
    cors: {
        origin: "*", // يمكنك تغيير هذا إلى الأصل الذي تريده
        methods: ["GET", "POST"]
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.get('/:room/:name', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public','index.html'));
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

let socketsConected = new Set();
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

io.on('connection', onConnect)

function onConnect(socket){
socketsConected.add(socket.id);
socket.on('joinRoom',(room,name)=>{
    
    socketsConected.add(socket.id);
    
    socket.emit('name',name);
    socket.broadcast.emit('messageRoom', `${name} has joined the room`);
});

    console.log('user connected with id = '+socket.id);

    socket.on('uploadImage',(imageData,callback)=>{
         const buffer = Buffer.from(imageData.data, 'base64');
        const filePath = path.join(uploadDir, `${Date.now()}.jpg`);
        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error(err);
                callback({ status: 'error', message: 'Failed to upload image' });
            } else {
                const relativePath = `/uploads/${path.basename(filePath)}`;
                callback({ status: 'ok', path: relativePath });
                io.emit('newImage', `/uploads/${path.basename(filePath)}`, socket.id);
            }
        });
    });

    io.emit('clients-total',socketsConected.size);

    socket.on('disconnect', ()=>{
        console.log('user disconnected with id = '+socket.id);
        socketsConected.delete(socket.id);
        io.emit('clients-total',socketsConected.size);
    });
    
    socket.on('message', (data)=>{
        
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('feedback', (data)=>{
        socket.broadcast.emit('feedback', data)
    });
    socket.on('voiceNote',audioBuffer =>{
    const filePath = path.join(__dirname,'uploads',`${Date.now()}.webm`);
    fs.writeFile(filePath,Buffer.from(audioBuffer),err=>{
        if(err) console.error(err);
        else{
            console.log('voice note saved successfully at',audioBuffer);
            io.emit('voiceNote',audioBuffer,socket.id);
        }
    });
    });

}

app.all("*", (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server`);
    next(err);
});
server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});