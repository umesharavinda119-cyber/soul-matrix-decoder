// =================================================================
// CHATBOT UI INTERACTIONS & TOGGLE LOGIC
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const chatTriggerBtn = document.getElementById('chat-trigger-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    
    const chatLangBtn = document.getElementById('chat-lang-btn');
    const chatVoiceBtn = document.getElementById('chat-voice-toggle');
    
    let chatLang = 'si';
    let voiceActive = false;

    // 1. Toggle Chat Window
    if (chatTriggerBtn && chatWindow && closeChatBtn) {
        chatTriggerBtn.addEventListener('click', () => {
            const isHidden = chatWindow.style.display === 'none';
            chatWindow.style.display = isHidden ? 'flex' : 'none';
            chatTriggerBtn.innerHTML = isHidden ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-comment-dots"></i>';
        });

        closeChatBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            chatTriggerBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
        });
    }

    // 2. Language Toggle inside Chat Header
    if (chatLangBtn) {
        chatLangBtn.addEventListener('click', () => {
            chatLang = chatLang === 'si' ? 'en' : 'si';
            chatLangBtn.innerText = chatLang === 'si' ? 'සි | EN' : 'EN | සි';
            // Placeholder: Translation Logic for Chat Messages will go here
        });
    }

    // 3. Voice Assistant Toggle
    if (chatVoiceBtn) {
        chatVoiceBtn.addEventListener('click', () => {
            voiceActive = !voiceActive;
            if (voiceActive) {
                chatVoiceBtn.classList.add('active');
                // Placeholder: Start Voice Recording / ElevenLabs Connection Logic
                console.log("Voice Assistant Activated");
            } else {
                chatVoiceBtn.classList.remove('active');
                // Placeholder: Stop Voice Recording
                console.log("Voice Assistant Deactivated");
            }
        });
    }
});
