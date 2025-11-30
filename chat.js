// ===============================================
// chat.js - РЕАЛЬНАЯ ИНТЕГРАЦИЯ AI CHEF И АНИМАЦИЯ ПЕЧАТИ
// ===============================================

// !!! ВАЖНО: Ваш API ключ. Не оставляйте его в открытом доступе надолго!
const GEMINI_API_KEY = "AIzaSyA2MGN5hdXm4KdqfUe748DPfTbFrnlsUeI"; 
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;


document.addEventListener('DOMContentLoaded', () => {

    // 1. Получаем ссылки на элементы
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // 2. Функция для создания и добавления сообщения в чат (возвращает элемент)
    function appendMessage(sender, text, isTemporary = false) {
        const messageElement = document.createElement('p');
        messageElement.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageElement.textContent = text;
        if (isTemporary) {
            messageElement.id = 'temp-message'; 
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement; // КРИТИЧНО для анимации: возвращаем элемент
    }


    // 3. НОВАЯ ФУНКЦИЯ: Анимация печати текста
    function typeWriterEffect(element, text) {
        let i = 0;
        element.textContent = ''; // Очищаем элемент
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); 
                i++;
                setTimeout(type, 30); // Скорость печати (30 мс)
            } else {
                element.classList.remove('typing'); // Удаляем курсор
            }
        }
        
        element.classList.add('typing'); // Добавляем курсор
        type();
    }


    // 4. Асинхронная функция отправки запроса (ОБЪЕДИНЕННАЯ ЛОГИКА)
    async function handleSend() {
        const text = userInput.value.trim();
        if (text === '') return;

        // ШАГ 1: Отображаем сообщение пользователя
        appendMessage('user', text);
        userInput.value = '';
        
        sendButton.disabled = true;
        userInput.disabled = true;

        // Временное сообщение-заглушка
        const tempMessageElement = appendMessage('bot', "Шеф-повар ищет идеальный рецепт...", true); 

        // ===========================================
        // ЛОГИКА ВЫЗОВА API GEMINI
        // ===========================================
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{text: SYSTEM_PROMPT + ` Мои ингредиенты: ${text}. Какой рецепт ты предложишь?`} ]
                        }
                    ],
                    config: {
                        maxOutputTokens: 1024, 
                        temperature: 0.7 
                    }
                })
            });

            const data = await response.json();

            // Удаляем временное сообщение сразу после получения данных
            tempMessageElement.remove(); 
            
            let chefResponse = "Извините, я не смог найти подходящий рецепт. Проверьте ингредиенты или попробуйте еще раз.";

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
                chefResponse = data.candidates[0].content.parts[0].text;
            } else if (data.error) {
                chefResponse = `Ошибка API: ${data.error.message}. Проверьте правильность ключа.`;
            }

            // ШАГ 5: Отображение реального ответа с АНИМАЦИЕЙ
            const botMessageElement = appendMessage('bot', ''); // Создаем пустой элемент
            typeWriterEffect(botMessageElement, chefResponse); // Запускаем анимацию!

        } catch (error) {
            console.error("Fetch Error:", error);
            tempMessageElement.remove();
            appendMessage('bot', "Ошибка соединения. Проверьте интернет или ключ API.");
        } finally {
            // Включаем кнопку и поле ввода обратно
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }

    // 5. Привязка функций к событиям
    sendButton.addEventListener('click', handleSend);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleSend();
        }
    });

});