

        // Loader Animation Script
        document.addEventListener('DOMContentLoaded', function () {
            const loader = document.getElementById('loader');
            const progressBar = document.getElementById('loaderProgressBar');
            const chatContainer = document.querySelector('.chat-container');
            const loadingMessages = [
                "Loading medical database...",
                "Initializing AI models...",
                "Setting up secure connection...",
                "Almost ready..."
            ];
            const loaderSubtitle = document.querySelector('.loader-subtitle');

            let progress = 0;
            let messageIndex = 0;

            function updateLoader() {
                progress += Math.random() * 10 + 5;
                if (progress > 100) progress = 100;

                progressBar.style.width = progress + '%';

                // Update loading message
                if (progress > (messageIndex + 1) * 25 && messageIndex < loadingMessages.length - 1) {
                    messageIndex++;
                    loaderSubtitle.textContent = loadingMessages[messageIndex];
                }

                if (progress >= 100) {
                    // Hide loader and show chat
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.remove();
                        chatContainer.style.opacity = '1';
                        document.getElementById('messageInput').focus();
                    }, 500);
                } else {
                    setTimeout(updateLoader, 300 + Math.random() * 300);
                }
            }

            // Start loader animation
            setTimeout(updateLoader, 500);

            // Fallback in case loader gets stuck
            setTimeout(() => {
                if (progress < 100) {
                    progressBar.style.width = '100%';
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.remove();
                        chatContainer.style.opacity = '1';
                        document.getElementById('messageInput').focus();
                    }, 500);
                }
            }, 5000);
        });

        // API Configuration
        const API_CONFIG = {
            url: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: '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',
            model: 'meta-llama/llama-4-scout-17b-16e-instruct'
        };

        let conversationHistory = [];

        // DOM Elements
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingIndicator = document.getElementById('typingIndicator');

        messageInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            messageInput.value = '';
            messageInput.style.height = 'auto';
            sendBtn.disabled = true;

            addMessage(message, 'user');

            // Show typing indicator
            showTypingIndicator();

            try {
                // Make API call
                const response = await callGroqAPI(message);

                hideTypingIndicator();

                addMessage(response, 'bot');

            } catch (error) {
                console.error('API Error:', error);
                hideTypingIndicator();
                addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'bot', true);
            }

            // Re-enable send button
            sendBtn.disabled = false;
            messageInput.focus();
        }

        // Call Groq API
        async function callGroqAPI(userMessage) {
            // Add user message to conversation history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            const requestBody = {
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an interactive medical AI assistant named Doc Bot. Your role is to gather information through questions before providing advice. Always ask follow-up questions to better understand the user\'s situation. For example: ask about symptoms duration, severity, location, what makes it better/worse, medical history, current medications, age range, etc. Only provide comprehensive answers after gathering sufficient information. Keep responses conversational and ask one focused question at a time. Always remind users to consult healthcare professionals for serious concerns.'
                    },
                    ...conversationHistory
                ]
            };

            const response = await fetch(API_CONFIG.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const botResponse = data.choices[0].message.content;

            // Add bot response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: botResponse
            });

            return botResponse;
        }

        // Add message to chat
        function addMessage(content, sender, isError = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            // Change this:
            avatar.textContent = sender === 'user' ? 'U' : 'DR';

            // To this:
            if (sender === 'user') {
                avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
            } else {
                avatar.innerHTML = '<i class="fa-solid fa-user-doctor"></i>'; // or keep 'DR' if you prefer
            }
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            if (isError) {
                messageContent.innerHTML = `<div class="error-message">${content}</div>`;
            } else {
                messageContent.textContent = content;
            }

            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            messageDiv.appendChild(avatar);
            const contentWrapper = document.createElement('div');
            contentWrapper.appendChild(messageContent);
            contentWrapper.appendChild(messageTime);
            messageDiv.appendChild(contentWrapper);

            // Remove welcome message if it exists
            const welcomeMessage = messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Show typing indicator
        function showTypingIndicator() {
            typingIndicator.classList.add('show');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Hide typing indicator
        function hideTypingIndicator() {
            typingIndicator.classList.remove('show');
        }

        // Start new chat
        function startNewChat() {
            conversationHistory = [];
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                     <div class="welcome-icon">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="welcome-title">Welcome to Doc Bot</div>
                    <div class="welcome-subtitle">Your interactive medical assistant. I'll ask questions to better understand your health concerns before providing personalized advice.</div>
                    <div class="conversation-starters">
                        <div class="starter-title">Try asking about:</div>
                        <div class="starter-buttons">
                            <button class="starter-btn" onclick="startConversation('I have a headache')">💊 Symptoms</button>
                            <button class="starter-btn" onclick="startConversation('I want to improve my health')">🏃 Wellness</button>
                            <button class="starter-btn" onclick="startConversation('I have questions about medication')">💉 Medications</button>
                            <button class="starter-btn" onclick="startConversation('I need lifestyle advice')">🥗 Lifestyle</button>
                        </div>
                    </div>
                </div>
                <div class="typing-indicator" id="typingIndicator">
                    <div class="message-avatar">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">DR</div>
                    </div>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
        }

        // Start conversation with predefined message
        function startConversation(message) {
            messageInput.value = message;
            sendMessage();
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            messageInput.focus();
        });


