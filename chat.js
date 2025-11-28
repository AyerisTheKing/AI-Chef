// ===============================================
// НОВАЯ СТРУКТУРА: Ждем загрузки страницы (Решение проблемы)
// ===============================================

document.addEventListener('DOMContentLoaded', (event) => {
    
    // ВЕСЬ ПРЕДОСТАВЛЕННЫЙ ВАМИ КОД ДОЛЖЕН БЫТЬ ВНУТРИ ЭТОГО БЛОКА:

    // 1. Получаем ссылки на элементы из chatindex.html
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // 2. Функция для создания и добавления сообщения в чат
    function appendMessage(sender, text) {
        const messageElement = document.createElement('p');
        // Используем классы, определенные в chatstyle.css
        if (sender === 'user') {
            messageElement.className = 'user-message';
        } else {
            messageElement.className = 'bot-message';
        }
        
        // Вставляем текст
        messageElement.textContent = text; 
        
        // Добавляем элемент в окно чата
        chatMessages.appendChild(messageElement);
        
        // Автоматическая прокрутка вниз
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 3. Функция, которая запускается при нажатии кнопки
    function handleSend() {
        const text = userInput.value.trim();
        
        // Проверка, что пользователь что-то ввел
        if (text === '') return;

        // ШАГ 1: Отображаем сообщение пользователя
        appendMessage('user', text);
        
        // Очищаем поле ввода
        userInput.value = '';

        // ШАГ 2: Заглушка для ответа ИИ (Mock Logic)
        const botResponseText = generateMockChefResponse(text);

        // Имитация ответа через небольшую задержку
        setTimeout(() => {
            appendMessage('bot', botResponseText);
        }, 200);
    }

    // 4. Логика заглушки для имитации ответа AI Chef
    function generateMockChefResponse(ingredients) {
        const baseResponse = "Превосходно! Учитывая ваши ингредиенты (" + ingredients + "), я подобрал идеальный рецепт: ";
        
        if (ingredients.toLowerCase().includes('курица') && ingredients.toLowerCase().includes('картошка')) {
            return baseResponse + "Жареная курица с ароматным картофелем по-деревенски. Это просто и сытно! Приступим к приготовлению?";
        } else if (ingredients.toLowerCase().includes('яйца') && ingredients.toLowerCase().includes('сыр')) {
            return baseResponse + "Идеальный французский омлет (Фриттата) с сыром и травами. Быстрый и элегантный завтрак! Подробности у вас на экране.";
        } else {
            return baseResponse + "Изысканный ужин в стиле Fusion. Нам понадобится еще пара специй, но блюдо будет стоить того! Уточните, что именно вы хотите?";
        }
    }


    // 5. Привязка функций к событиям

    // Привязка к кнопке
    sendButton.addEventListener('click', handleSend);

    // Привязка к клавише Enter в поле ввода (используем keydown для лучшей совместимости)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

}); // <-- Конец блока DOMContentLoaded