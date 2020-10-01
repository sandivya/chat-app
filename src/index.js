const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('../src/utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

const html_path = path.join(__dirname, '../public')
app.use(express.static(html_path)) //load static files

const io = socketio(server)

const chatTime = () => {
    return new Date().getDate()
}

io.on('connection', (socket) => {

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${position.lat},${position.lon}`))
        callback()
    })

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({
            id: socket.id,
            username,
            room
        })

        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('notif', generateMessage('Administrator', `Welcome to ${user.room} chat, ${user.username}`))
        socket.broadcast.to(room).emit('notif', generateMessage('Administrator', `${user.username} has joined the room.`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('notif', generateMessage('Administrator', `${user.username} has left the room.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log('Chat App started on port :', port)
})