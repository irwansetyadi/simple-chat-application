const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {generateMessage, generateLocationMessage} = require('./utilities/message');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utilities/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDir = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(express.static(publicDir));


io.on('connection', (socket) => {
    console.log(`New connection estabilished`);

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room});

        if(error) return callback(error);


        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    }) 

    
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id);


        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback('delivered!');
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);


        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback('Location shared')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
})



server.listen(port, () => console.log(`Listening on port ${port}`));





