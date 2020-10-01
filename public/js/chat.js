const socket = io()

//Elements
const $messageForm = document.querySelector('#submit_msg')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const notifTemplate = document.querySelector('#notif-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {

    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight

    //Far scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('notif', (msg) => {
    const html = Mustache.render(notifTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locMessage) => {
    const html = Mustache.render(locationTemplate, {
        username: locMessage.username,
        locUrl: locMessage.url,
        createdAt: moment(locMessage.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', $messageFormInput.value, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
    })
})

$locationButton.addEventListener('click', (e) => {
    const nav = navigator.geolocation

    if(!nav){
        return alert('Location service unsupported by browser')
    }
    $locationButton.setAttribute('disabled', 'disabled')

    nav.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
        })
    }) 

})

socket.emit('join', {
    username,
    room
}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})