// =================================================================
// FULL CHATBOT LOGIC WITH GEMINI & ELEVENLABS AUDIO
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const chatTriggerBtn = document.getElementById('chat-trigger-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    
    const chatLangBtn = document.getElementById('chat-lang-btn');
    const chatVoiceBtn = document.getElementById('chat-voice-toggle');
    
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    let chatLang = 'si';
    let voiceActive = false;
    let currentAudio = null; // Currently playing voice

    // 1. Toggle Chat Window
    if (chatTriggerBtn && chatWindow && closeChatBtn) {
        chatTriggerBtn.addEventListener('click', () => {
            const isHidden = chatWindow.style.display === 'none';
            chatWindow.style.display = isHidden ? 'flex' : 'none';
            chatTriggerBtn.innerHTML = isHidden ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-comment-dots"></i>';
            if(isHidden) chatInput.focus();
        });

        closeChatBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            chatTriggerBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
        });
    }

    // 2. Language Toggle
    if (chatLangBtn) {
        chatLangBtn.addEventListener('click', () => {
            chatLang = chatLang === 'si' ? 'en' : 'si';
            chatLangBtn.innerText = chatLang === 'si' ? 'සි | EN' : 'EN | සි';
        });
    }

    // 3. Voice Toggle
    if (chatVoiceBtn) {
        chatVoiceBtn.addEventListener('click', () => {
            voiceActive = !voiceActive;
            if (voiceActive) {
                chatVoiceBtn.classList.add('active');
            } else {
                chatVoiceBtn.classList.remove('active');
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            }
        });
    }

    // 4. UI: Append Message Function
    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerText = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
    }

    // 5. Send Message to Server
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Show user message
        appendMessage('user', text);
        chatInput.value = '';
        
        // Show loading typing indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message bot-msg';
        loadingDiv.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    lang: chatLang,
                    voice: voiceActive
                })
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            chatBody.removeChild(loadingDiv);

            // API Error එක අල්ලා ගැනීම සඳහා යාවත්කාලීන කරන ලද කොටස
            if (data.reply) {
                appendMessage('bot', data.reply);
            } else if (data.error) {
                appendMessage('bot', 'API Error: ' + data.error);
            } else {
                appendMessage('bot', 'System Error: No response received.');
            }

            // Play Audio if received
            if (data.audio && voiceActive) {
                if (currentAudio) {
                    currentAudio.pause();
                }
                currentAudio = new Audio("data:audio/mp3;base64," + data.audio);
                currentAudio.play();
            }

        } catch (error) {
            if (chatBody.contains(loadingDiv)) {
                chatBody.removeChild(loadingDiv);
            }
            appendMessage('bot', 'Connection Error. Please try again.');
            console.error('Chat Error:', error);
        }
    }

    // 6. Bind Event Listeners for Input
    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});
