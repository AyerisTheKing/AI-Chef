/* chat.js v2.1 | 01.12.2025 | Исправлено: добавлены функции appendMessage и typeWriterEffect */

// Меняем полный URL прокси на относительный путь, который определен в Netlify.toml
const PROXY_URL = "/functions/gemini-proxy";
const API_TIMEOUT_MS = 15000; // 15 секунд

document.addEventListener('DOMContentLoaded', () => {

    // 1. Получаем элементы интерфейса
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    let isRequestInProgress = false;

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (КОТОРЫХ НЕ ХВАТАЛО) ---

    // Функция добавления сообщения в чат
    function appendMessage(sender, text, isTemporary = false) {
        const messageElement = document.createElement('div');
        
        // Добавляем классы стилей (user-message или bot-message)
        if (sender === 'user') {
            messageElement.classList.add('user-message');
        } else {
            messageElement.classList.add('bot-message');
        }

        messageElement.textContent = text;
        
        // Если это временное сообщение (например, "Печатает..."), добавляем спец. класс
        if (isTemporary) {
            messageElement.classList.add('temp-loading-msg');
            messageElement.style.fontStyle = "italic"; // Доп. стиль для временного сообщения
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Прокрутка вниз
        
        return messageElement;
    }

    // Функция эффекта печатной машинки
    function typeWriterEffect(element, text) {
        let i = 0;
        element.textContent = ''; // Очищаем элемент перед печатью
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); 
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight; 
                setTimeout(type, 15); // Скорость печати (чем меньше число, тем быстрее)
            } else {
                element.classList.remove('typing'); 
            }
        }
        
        element.classList.add('typing'); 
        type();
    }

    // --- ОСНОВНАЯ ЛОГИКА ---

    // Главная функция отправки
    async function handleSend() {
        const text = userInput.value.trim();
        if (text === '' || isRequestInProgress) return; 

        // 1. Показываем сообщение пользователя
        appendMessage('user', text);
        userInput.value = '';
        
        // Блокируем интерфейс
        sendButton.disabled = true;
        userInput.disabled = true;
        isRequestInProgress = true;

        // 2. Показываем временное сообщение "Думает..."
        const tempMessageElement = appendMessage('bot', "Шеф-повар ищет идеальный рецепт...", true); 
        
        let chefResponse = "";

        // Настройка тайм-аута (если сервер долго не отвечает)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
            // 3. Отправляем запрос на ваш ПРОКСИ (Netlify)
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ userText: text }) 
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            
            // Получаем ответ от ИИ
            chefResponse = data.message;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Chat Error:", error);
            
            if (error.name === 'AbortError') {
                chefResponse = "Время ожидания истекло. Похоже, на кухне завал. Попробуйте еще раз!";
            } else {
                chefResponse = `Произошла ошибка: ${error.message}. Попробуйте обновить страницу.`;
            }

        } finally {
            // 4. Удаляем временное сообщение
            if (tempMessageElement) {
                tempMessageElement.remove(); 
            }
            
            // 5. Печатаем ответ бота
            const botMessageElement = appendMessage('bot', '');
            typeWriterEffect(botMessageElement, chefResponse);

            // Разблокируем интерфейс
            sendButton.disabled = false;
            userInput.disabled = false;
            isRequestInProgress = false;
            userInput.focus();
        }
    }

    // Привязка событий (клик и Enter)
    sendButton.addEventListener('click', handleSend);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleSend();
        }
    });

});