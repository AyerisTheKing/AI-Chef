/* chat.js v1.0 | 30.11.2025 | Финальная стабильная версия с API, таймаутом и анимацией */

const GEMINI_API_KEY = "AIzaSyA2MGN5hdXm4KdqfUe748DPfTbFrnlsUeI"; // !!! ЗАМЕНИТЕ НА СВОЙ КЛЮЧ API !!!
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;
const API_TIMEOUT_MS = 15000; // 15 секунд

document.addEventListener('DOMContentLoaded', () => {

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let isRequestInProgress = false; // Флаг защиты от спама

    // ФУНКЦИЯ ДОБАВЛЕНИЯ СООБЩЕНИЯ
    function appendMessage(sender, text, isTemporary = false) {
        const messageElement = document.createElement('p');
        messageElement.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageElement.textContent = text;
        
        if (isTemporary) {
            messageElement.classList.add('temp-loading-msg');
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }

    // ФУНКЦИЯ ЭФФЕКТА ПЕЧАТНОЙ МАШИНКИ
    function typeWriterEffect(element, text) {
        let i = 0;
        element.textContent = ''; 
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); 
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight; 
                setTimeout(type, 20);
            } else {
                element.classList.remove('typing'); 
            }
        }
        
        element.classList.add('typing'); 
        type();
    }

    // ГЛАВНАЯ ФУНКЦИЯ ОТПРАВКИ
    async function handleSend() {
        const text = userInput.value.trim();
        if (text === '' || isRequestInProgress) return; 

        appendMessage('user', text);
        userInput.value = '';
        
        sendButton.disabled = true;
        userInput.disabled = true;
        isRequestInProgress = true;

        const tempMessageElement = appendMessage('bot', "Шеф-повар ищет идеальный рецепт...", true); 
        
        let chefResponse = "";

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    // Системная инструкция
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    contents: [
                        {
                            role: "user",
                            // Шаблонная строка (Template Literal)
                            parts: [{ text: `Мои ингредиенты: ${text}. Какой рецепт ты предложишь?` }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1500, 
                        temperature: 0.7 
                    }
                })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error ? errorData.error.message : `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                chefResponse = data.candidates[0].content.parts[0].text;
            } else {
                chefResponse = "Шеф-повар в замешательстве. Попробуйте уточнить список продуктов.";
            }

        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Chat Error:", error);
            
            if (error.name === 'AbortError') {
                chefResponse = "Время ожидания истекло. Похоже, на кухне завал. Попробуйте еще раз!";
            } else {
                chefResponse = `Произошла ошибка: ${error.message}. Проверьте соединение.`;
            }

        } finally {
            // Удаляем временное сообщение
            if (tempMessageElement) {
                tempMessageElement.remove(); 
            }
            
            // Печатаем ответ
            const botMessageElement = appendMessage('bot', '');
            typeWriterEffect(botMessageElement, chefResponse);

            // Сбрасываем состояние
            sendButton.disabled = false;
            userInput.disabled = false;
            isRequestInProgress = false;
            userInput.focus();
        }
    }

    // Привязка событий
    sendButton.addEventListener('click', handleSend);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleSend();
        }
    });

});