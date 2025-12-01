/* chat.js v2.0 | Использование Serverless Proxy для защиты ключа */

const PROXY_URL = "/.netlify/functions/gemini-proxy"; // Адрес вашего прокси
const API_TIMEOUT_MS = 15000; // 15 секунд

document.addEventListener('DOMContentLoaded', () => {
    // ... (Остальной код для DOM элементов, appendMessage, typeWriterEffect остается прежним) ...

    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    let isRequestInProgress = false;

    // ... (функции appendMessage и typeWriterEffect) ...

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
            // !!! НОВОЕ: Отправляем запрос на ваш ПРОКСИ-СЕРВЕР Netlify
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ userText: text }) 
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Произошла ошибка на сервере: ${response.status}`);
            }

            const data = await response.json();
            
            chefResponse = data.message;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Chat Error:", error);
            
            if (error.name === 'AbortError') {
                chefResponse = "Время ожидания истекло. Похоже, на кухне завал. Попробуйте еще раз!";
            } else {
                chefResponse = `Произошла ошибка: ${error.message}. Проверьте настройки ключа API в Netlify.`;
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