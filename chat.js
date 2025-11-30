// ===============================================
// chat.js - FINAL BEST VERSION (Corrected Syntax & Logic)
// ===============================================

// !!! ВАЖНО: Ваш API ключ
const GEMINI_API_KEY = "AIzaSyA2MGN5hdXm4KdqfUe748DPfTbFrnlsUeI"; 
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;

// Максимальное время ожидания (15 секунд)
const API_TIMEOUT_MS = 15000;

document.addEventListener('DOMContentLoaded', () => {

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Флаг защиты от повторных нажатий
    let isRequestInProgress = false; 

    // ---------------------------------------------------------
    // 1. ФУНКЦИЯ ДОБАВЛЕНИЯ СООБЩЕНИЯ (Возвращает HTML-элемент)
    // ---------------------------------------------------------
    function appendMessage(sender, text, isTemporary = false) {
        const messageElement = document.createElement('p');
        messageElement.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageElement.textContent = text;
        
        if (isTemporary) {
            messageElement.classList.add('temp-loading-msg'); // Класс для удобства, если понадобится
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }

    // ---------------------------------------------------------
    // 2. ФУНКЦИЯ ЭФФЕКТА ПЕЧАТНОЙ МАШИНКИ
    // ---------------------------------------------------------
    function typeWriterEffect(element, text) {
        let i = 0;
        element.textContent = ''; 
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); 
                i++;
                // Авто-скролл во время печати, чтобы текст не уходил за экран
                chatMessages.scrollTop = chatMessages.scrollHeight; 
                setTimeout(type, 20); // Чуть быстрее (20мс) для динамики
            } else {
                element.classList.remove('typing'); 
            }
        }
        
        element.classList.add('typing'); 
        type();
    }

    // ---------------------------------------------------------
    // 3. ГЛАВНАЯ ФУНКЦИЯ ОТПРАВКИ (HANDLE SEND)
    // ---------------------------------------------------------
    async function handleSend() {
        const text = userInput.value.trim();
        
        // Блокировка: если пусто или запрос уже идет -> выходим
        if (text === '' || isRequestInProgress) return;

        // 1. UI: Показываем сообщение пользователя
        appendMessage('user', text);
        userInput.value = '';
        
        // 2. UI: Блокируем интерфейс
        sendButton.disabled = true;
        userInput.disabled = true;
        isRequestInProgress = true;

        // 3. UI: Показываем временное сообщение
        const tempMessageElement = appendMessage('bot', "Шеф-повар ищет идеальный рецепт...", true); 
        
        let chefResponse = "";

        // Настройка таймаута
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
            // 4. NETWORK: Запрос к API
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    // Системная инструкция (Правильный формат для v1beta)
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    contents: [
                        {
                            role: "user",
                            // ОБРАТНЫЕ КАВЫЧКИ ИСПРАВЛЕНЫ НИЖЕ:
                            parts: [{ text: `Мои ингредиенты: ${text}. Какой рецепт ты предложишь?` }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1500, 
                        temperature: 0.7 
                    }
                })
            });

            clearTimeout(timeoutId); // Очищаем таймер, если ответ пришел

            if (!response.ok) {
                const errorData = await response.json();
                // ОБРАТНЫЕ КАВЫЧКИ ИСПРАВЛЕНЫ:
                throw new Error(errorData.error ? errorData.error.message : `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            
            // Парсинг ответа
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
                // ОБРАТНЫЕ КАВЫЧКИ ИСПРАВЛЕНЫ:
                chefResponse = `Произошла ошибка: ${error.message}. Проверьте соединение.`;
            }

        } finally {
            // 5. CLEANUP: Удаляем временное сообщение
            if (tempMessageElement) {
                tempMessageElement.remove(); 
            }
            
            // 6. UI: Печатаем ответ (если он есть)
            const botMessageElement = appendMessage('bot', '');
            typeWriterEffect(botMessageElement, chefResponse);

            // 7. RESET: Разблокируем интерфейс
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