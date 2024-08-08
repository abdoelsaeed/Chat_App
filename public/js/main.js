const socket = io();

const numSockets = document.getElementById("clients-total");
const messageTone = new Audio('./../message-tone.mp3')
//* --> ul
const messageJoinClient= document.getElementById("message");
// uploadimage
const uploadImage = document.getElementById("uploadImage");

const messageContainer = document.getElementById("message-container");
//& --> title
const nameInput = document.getElementById('name-input');
//?  -->Form
const messageForm = document.getElementById('message-form');
//! -->input 
const messageInput = document.getElementById('message-input');
//todo --> recordButton
const recordButton = document.getElementById('recordButton');

const power = document.getElementById('connected');
const span = document.getElementById('span');
const i = document.getElementById('fa-solid');
let mediaRecorder;
let audioChunks = [];
        const pathArray = window.location.pathname.split('/');
        const room = pathArray[1];
        const namee = pathArray[2];
        socket.emit('joinRoom', room, namee);

power.addEventListener('click',(e)=>{
    e.preventDefault();
    if(socket.connected){
    span.textContent = 'OFF';
    span.style.color='#f44336';
    i.style.color='#f44336';
    socket.disconnect();
    }
    else {
    span.textContent = 'ON';
    span.style.color='rgb(0, 156, 127)';
    i.style.color='rgb(0, 156, 127)';
        socket.connect();
    }
});
uploadImage.addEventListener('change', function(event) {
    const imageInput = event.target.files[0];
    if (imageInput) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // ارسال بيانات الصورة كـ Base64
            socket.emit('uploadImage', { data: e.target.result.split(',')[1] }, function(response) {
                if (response.status === 'ok') {
                    console.log('Image uploaded successfully:', response.path);
                } else {
                    console.error('Image upload failed:', response.message);
                }
            });
        };
        reader.readAsDataURL(imageInput);
    } else {
        console.error('No file selected');
    }
});
// عرض الصور الجديدة
socket.on('newImage',async (imagePath, id) => {

   const li = document.createElement('li');
    if (id === socket.id) li.className = 'message-right';
    else li.className = 'message-left';

    const img = document.createElement('img');
    img.src = imagePath;  // هنا سيتم استخدام URL للصورة
    img.alt = "New Image";
    img.style.maxWidth = '100%';    
    img.style.maxHeight = '100%';

    li.appendChild(img);

    const p = document.createElement('p');
    p.className = 'message';
    const span = document.createElement('span');
        span.textContent = `${nameInput.value} 🟢 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    p.appendChild(span);
    li.appendChild(p);
    messageContainer.appendChild(li);
    await messageTone.play();
});

recordButton.addEventListener('mousedown', e =>{
    recordButton.style.backgroundColor = 'rgb(0 92 75 / 35%)';
    recordVoice();
})
recordButton.addEventListener('mouseup',e=>{
    recordButton.style.backgroundColor = 'white';
    stopVoice();
});
messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(messageInput.value){
        
        sendMessage();
    }
});

messageInput.addEventListener('keypress', (e)=>{
    socket.emit('feedback',{feedback:`✍️ ${nameInput.value} is typing a message...`});
});

messageInput.addEventListener('focus', (e)=>{
    socket.emit('feedback',{feedback:`✍️ ${nameInput.value} is typing a message...`});
});

messageInput.addEventListener('blur', (e)=>{
    socket.emit('feedback',{feedback:``});
});


socket.on('clients-total', (data) => {
    numSockets.textContent = `Total clients connected: ${data}`;
});

socket.on('messageRoom', (message) => {
    console.log(message)
            messageJoinClient.innerHTML = message;
            messageJoinClient.style.color = 'rgb(0 92 75)';
               setTimeout(()=>{
                messageJoinClient.innerHTML = '';
            },4000)
            
        });
        socket.on('name', (name) => {
            nameInput.value = name;
        });
        
socket.on('chat-message', async (data)=>{
    await messageTone.play();
    console.log(messageTone)
    addMessageToUI(false,data)
});



socket.on('feedback', (data)=>{
    clearFeedback();
    const typing =` <li class="message-feedback">
        <p class="feedback" id="feedback">${data.feedback}</p>
        </li>`;
    messageContainer.innerHTML += typing;
});
socket.on('name',data=>{
    nameInput.innerHTML = data;
})  
socket.on('voiceNote',async (audioBuffer,id) =>{
        const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.controls = true;
        const li = document.createElement('li');
        if(id===socket.id) li.className = 'message-right';
        else li.className = 'message-left';
        li.appendChild(audio);
        const p = document.createElement('p');
        p.className='message';
        const span = document.createElement('span');
        span.textContent = `${nameInput.value} 🟢 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
        p.appendChild(span);
        li.appendChild(p);
        console.log(li)
        messageContainer.appendChild(li);
        await messageTone.play();
        audio.play();
});

function sendMessage(){
    const data = {
        name:nameInput.value,
        message: messageInput.value,
        dateTime:new Date()
    }
    socket.emit('message', data);

    addMessageToUI(true,data);
    messageInput.value = '';

}

function recordVoice(){
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorder.start();
            mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
                });
            });
    };

function stopVoice() {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                const reader = new FileReader();
                reader.readAsArrayBuffer(audioBlob);
                reader.onloadend = () => {
                socket.emit('voiceNote', reader.result);
                    
                };
            });
        }
    }

function addMessageToUI(isOwnMessage,data){
    const message = `<li class="${isOwnMessage?'message-right':'message-left'}">
    <p class="message"> ${data.message}
    <span>${data.name} 🟢 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}</span>
    </p>
    </li>`;
    
    messageContainer.innerHTML += message;
    
    scrollToBottom();
}

function scrollToBottom(){
    messageContainer.scrollTo(0,messageContainer.scrollHeight);
}

function clearFeedback(){
    document.querySelectorAll('li.message-feedback').forEach(el=>{el.parentNode.removeChild(el);});
}


