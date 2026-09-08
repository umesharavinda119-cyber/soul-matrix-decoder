// =================================================================
// FULL CHATBOT LOGIC WITH GEMINI, ELEVENLABS AUDIO & WHATSAPP LIMIT
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
    let currentAudio = null; 
    let messageCount = 0; 

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
    function appendMessage(sender, text, isHTML = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
        
        if (isHTML) {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.innerText = text;
        }
        
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
    }

    // 5. Send Message to Server
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // දත්ත ඇතුළත් කර නොමැති නම් චැට් කිරීම නැවැත්වීම
        if (!window.userNumerologyData && !window.userHoroscopeData) {
            appendMessage('bot', 'කරුණාකර මා සමඟ කතා කිරීමට පෙර, අංක විද්‍යාත්මක හෝ ජ්‍යොතිෂ පරීක්ෂාව සම්පූර්ණ කර (Submit කර) ඉන්න. ඉන්පසු ඔබට අදාළ නිවැරදිම තොරතුරු ලබා දීමට මට හැක.');
            chatInput.value = '';
            return; 
        }

        // Show user message
        appendMessage('user', text);
        chatInput.value = '';
        messageCount++; 

        // පණිවිඩ 2ක සීමාව පරීක්ෂා කිරීම
        if (messageCount > 2) {
            const waMsg = `ඔබගේ ගැටළු පිළිබඳ වැඩිදුර විස්තර සහ සම්පූර්ණ රහස්‍ය වාර්තාව ලබාගැනීම සඳහා කරුණාකර අපගේ WhatsApp අංකයට සම්බන්ධ වන්න.<br><br><a href="https://wa.me/94757290085" target="_blank" style="display:inline-block; background:#25D366; color:#fff; padding:8px 15px; border-radius:15px; text-decoration:none; font-weight:bold;">WhatsApp වෙත පිවිසෙන්න</a>`;
            
            appendMessage('bot', waMsg, true);
            return; 
        }
        
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
                    voice: voiceActive,
                    userData: window.userNumerologyData || null,
                    astroData: window.userHoroscopeData || null
                })
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            chatBody.removeChild(loadingDiv);

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
