// js/ai-chat.js

class AIChatWidget {
    constructor() {
        this.chatWindow = document.getElementById('chat-window');
        this.chatToggleButton = document.getElementById('chat-toggle-button');
        this.chatMessagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send-button');
        this.chatCloseButton = document.getElementById('chat-close-button');
        
        this.isTyping = false;
        this.messageHistory = JSON.parse(localStorage.getItem('aiChatHistory')) || [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeChat();
        this.loadChatHistory();
        this.addWelcomeMessage();
    }
    
    setupEventListeners() {
        // Toggle chat window
        if (this.chatToggleButton) {
            this.chatToggleButton.addEventListener('click', () => this.toggleChat());
        }
        
        // Close chat window
        if (this.chatCloseButton) {
            this.chatCloseButton.addEventListener('click', () => this.closeChat());
        }
        
        // Send message events
        if (this.chatSendButton) {
            this.chatSendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Enter key to send
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize input
            this.chatInput.addEventListener('input', () => this.handleInputChange());
        }
        
        // Handle outside clicks to close
        document.addEventListener('click', (e) => {
            if (!this.chatWindow.contains(e.target) && !this.chatToggleButton.contains(e.target)) {
                if (!this.chatWindow.classList.contains('hidden')) {
                    // Optional: auto-close when clicking outside
                    // this.closeChat();
                }
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.chatWindow.classList.contains('hidden')) {
                this.closeChat();
            }
        });
    }
    
    initializeChat() {
        if (this.chatWindow && this.chatToggleButton) {
            this.chatWindow.classList.add('hidden');
            this.chatToggleButton.classList.remove('hidden');
        }
    }
    
    toggleChat() {
        if (this.chatWindow.classList.contains('hidden')) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }
    
    openChat() {
        this.chatWindow.classList.remove('hidden');
        this.chatToggleButton.classList.add('hidden');
        
        // Focus input với delay để animation hoàn thành
        setTimeout(() => {
            if (this.chatInput) {
                this.chatInput.focus();
            }
        }, 300);
        
        // Analytics tracking (optional)
        this.trackEvent('chat_opened');
    }
    
    closeChat() {
        this.chatWindow.classList.add('hidden');
        this.chatToggleButton.classList.remove('hidden');
        
        // Save chat history
        this.saveChatHistory();
        
        // Analytics tracking (optional)
        this.trackEvent('chat_closed');
    }
    
    handleInputChange() {
        const isEmpty = this.chatInput.value.trim() === '';
        
        // Enable/disable send button
        if (this.chatSendButton) {
            this.chatSendButton.disabled = isEmpty || this.isTyping;
            this.chatSendButton.style.opacity = isEmpty || this.isTyping ? '0.6' : '1';
        }
        
        // Show typing indicator to user (optional)
        this.updateTypingStatus();
    }
    
    async sendMessage() {
        if (!this.chatInput || this.isTyping) return;
        
        const messageText = this.chatInput.value.trim();
        if (messageText === "") return;
        
        // Disable input during sending
        this.setInputState(false);
        
        // Add user message
        this.addMessage(messageText, 'user');
        this.chatInput.value = "";
        
        // Add to history
        this.messageHistory.push({ type: 'user', content: messageText, timestamp: Date.now() });
        
        // Show typing indicator
        const typingId = this.showTypingIndicator();
        
        try {
            const response = await this.callAIAPI(messageText);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add AI response
            this.addMessage(response, 'ai');
            this.messageHistory.push({ type: 'ai', content: response, timestamp: Date.now() });
            
            // Reset retry count on success
            this.retryCount = 0;
            
        } catch (error) {
            console.error('AI Chat Error:', error);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Handle retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.addMessage(`Đang thử lại... (${this.retryCount}/${this.maxRetries})`, 'ai-retry');
                
                // Retry after delay
                setTimeout(() => this.retrySendMessage(messageText), 2000);
            } else {
                this.addMessage(this.getErrorMessage(error), 'ai-error');
                this.retryCount = 0;
            }
        } finally {
            // Re-enable input
            this.setInputState(true);
        }
    }
    
    async retrySendMessage(messageText) {
        const typingId = this.showTypingIndicator();
        
        try {
            const response = await this.callAIAPI(messageText);
            this.removeTypingIndicator(typingId);
            this.addMessage(response, 'ai');
            this.messageHistory.push({ type: 'ai', content: response, timestamp: Date.now() });
            this.retryCount = 0;
        } catch (error) {
            this.removeTypingIndicator(typingId);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.retrySendMessage(messageText), 2000);
            } else {
                this.addMessage(this.getErrorMessage(error), 'ai-error');
                this.retryCount = 0;
            }
        }
    }
    
    async callAIAPI(message) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    history: this.getContextHistory() // Send recent context
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.';
            
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Yêu cầu bị timeout. Vui lòng thử lại.');
            }
            throw error;
        }
    }
    
    getContextHistory() {
        // Return last 6 messages for context
        return this.messageHistory.slice(-6);
    }
    
    addMessage(message, type) {
        if (!this.chatMessagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', this.getMessageClass(type));
        
        // Handle different message types
        if (type === 'ai') {
            messageDiv.innerHTML = this.formatAIMessage(message);
        } else {
            messageDiv.textContent = message;
        }
        
        // Add timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        timestamp.textContent = this.formatTime(new Date());
        messageDiv.appendChild(timestamp);
        
        this.chatMessagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add entrance animation
        requestAnimationFrame(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    getMessageClass(type) {
        const classMap = {
            'user': 'user-message',
            'ai': 'ai-message',
            'ai-typing': 'ai-message ai-typing',
            'ai-error': 'ai-message ai-error',
            'ai-retry': 'ai-message ai-retry',
            'system': 'system-message'
        };
        return classMap[type] || 'ai-message';
    }
    
    formatAIMessage(message) {
        // Convert markdown-like formatting
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    showTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.classList.add('message', 'ai-message', 'typing-indicator');
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">AI đang suy nghĩ...</span>
        `;
        
        this.chatMessagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        this.isTyping = true;
        
        return typingId;
    }
    
    removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
        this.isTyping = false;
    }
    
    setInputState(enabled) {
        if (this.chatInput) {
            this.chatInput.disabled = !enabled;
        }
        if (this.chatSendButton) {
            this.chatSendButton.disabled = !enabled;
        }
    }
    
    updateTypingStatus() {
        // Visual feedback while user types
        if (this.chatInput && this.chatInput.value.length > 0) {
            this.chatInput.style.borderColor = '#667eea';
        }
    }
    
    scrollToBottom() {
        if (this.chatMessagesContainer) {
            this.chatMessagesContainer.scrollTo({
                top: this.chatMessagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    addWelcomeMessage() {
        if (this.messageHistory.length === 0) {
            const welcomeMessage = "Xin chào! Tôi là AI Assistant. Tôi có thể giúp bạn trả lời câu hỏi và thảo luận về nhiều chủ đề. Bạn cần hỗ trợ gì hôm nay?";
            this.addMessage(welcomeMessage, 'ai');
            this.messageHistory.push({ type: 'ai', content: welcomeMessage, timestamp: Date.now() });
        }
    }
    
    loadChatHistory() {
        // Load recent messages (last 10)
        const recentHistory = this.messageHistory.slice(-10);
        recentHistory.forEach(msg => {
            this.addMessage(msg.content, msg.type);
        });
    }
    
    saveChatHistory() {
        // Keep only last 50 messages to avoid storage bloat
        const trimmedHistory = this.messageHistory.slice(-50);
        localStorage.setItem('aiChatHistory', JSON.stringify(trimmedHistory));
    }
    
    clearChatHistory() {
        this.messageHistory = [];
        this.chatMessagesContainer.innerHTML = '';
        localStorage.removeItem('aiChatHistory');
        this.addWelcomeMessage();
    }
    
    getErrorMessage(error) {
        const errorMessages = {
            'NetworkError': 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.',
            'timeout': 'Yêu cầu bị timeout. Vui lòng thử lại.',
            'server': 'Lỗi server. Vui lòng thử lại sau.',
            'default': 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.'
        };
        
        const errorType = this.detectErrorType(error);
        return errorMessages[errorType] || errorMessages.default;
    }
    
    detectErrorType(error) {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch')) return 'NetworkError';
        if (message.includes('timeout') || message.includes('abort')) return 'timeout';
        if (message.includes('500') || message.includes('502') || message.includes('503')) return 'server';
        return 'default';
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    trackEvent(eventName, data = {}) {
        // Analytics tracking (optional)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'custom_parameter': data,
                'event_category': 'AI_Chat'
            });
        }
        
        console.log(`Event tracked: ${eventName}`, data);
    }
    
    // Public methods for external use
    sendCustomMessage(message) {
        this.chatInput.value = message;
        this.sendMessage();
    }
    
    setAPIEndpoint(url) {
        this.apiEndpoint = url;
    }
}

// CSS cho typing indicator (thêm vào CSS)
const typingCSS = `
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #667eea;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1.2); opacity: 1; }
}

.typing-text {
    font-style: italic;
    opacity: 0.7;
    font-size: 0.9em;
}

.message-timestamp {
    font-size: 0.7em;
    opacity: 0.5;
    margin-top: 5px;
    display: block;
}

.ai-error {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52) !important;
    color: white !important;
}

.ai-retry {
    background: linear-gradient(135deg, #ffa726, #ff9800) !important;
    color: white !important;
}

.system-message {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    text-align: center;
    font-style: italic;
    margin: 10px auto;
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = typingCSS;
document.head.appendChild(styleSheet);

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChat = new AIChatWidget();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatWidget;
}