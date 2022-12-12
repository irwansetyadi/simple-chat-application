const socket = io();

//Elements
const messageForm = document.querySelector('.msg-form');
const inputForm = messageForm.querySelector('input');
const btnForm = document.querySelector('button');
const shareLockBtn = document.querySelector('.sendLoc');
const messages = document.querySelector('#messages');

//Template
const messageTemplate = document.querySelector('#message-box').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML; 
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {'ignoreQueryPrefix': true});

const autoscroll = () => {

    const newMessage = messages.lastElementChild

    //height of new message
    const newMessageMargin = parseInt(getComputedStyle(newMessage).marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    //Visible height
    const visibleHeight = messages.offsetHeight

    //Height of message container
    const containerHeight = messages.scrollHeight

    //Scrolling distance
    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) messages.scrollTop = messages.scrollHeight;
}

socket.on('message', (message) => {
    console.log(message);

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm A')
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

})

socket.on('locationMessage', (loc) => {
    console.log(loc);

    const html = Mustache.render(locationTemplate, {
        username: loc.username,
        url: loc.url,
        createdAt: moment(loc.createdAt).format('HH:mm A')
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })

    document.querySelector('#sidebar').innerHTML = html;
})


messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    btnForm.setAttribute('disabled', 'disabled');

    const msg = e.target.elements.inputText.value;
    socket.emit('sendMessage', msg, (messageStatus) => {

        btnForm.removeAttribute('disabled');
        inputForm.value = '';
        inputForm.focus();


        console.log(messageStatus)
    });
})

shareLockBtn.addEventListener('click', () => {
    if(!navigator.geolocation) return alert(`Geolocation is not supported`);
    
    shareLockBtn.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        shareLockBtn.removeAttribute('disabled');

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (messageStatus) => console.log(messageStatus))
    });
    
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error);
        location.href = '/';
    }
});