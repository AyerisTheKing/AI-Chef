/* gemini-proxy.js v1.2 | 05.12.2025 | FIX: Структура запроса Gemini API */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

exports.handler = async (event) => {
    
    // 1. Проверка метода (CORS обрабатывается через файл _headers, здесь только проверка метода)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Метод не разрешен. Используйте POST." };
    }

    // 2. Получаем ключ API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!GEMINI_API_KEY) {
        console.error("Ошибка: GEMINI_API_KEY не найден в переменных окружения.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ошибка конфигурации сервера: ключ API не найден." })
        };
    }

    // 3. Парсинг тела запроса от пользователя
    let userText;
    try {
        const body = JSON.parse(event.body);
        userText = body.userText;
    } catch (e) {
        return { statusCode: 400, body: "Неверный формат JSON." };
    }

    // 4. Формирование тела запроса к Google Gemini API (ИСПРАВЛЕНО!)
    const requestBody = {
        // systemInstruction теперь на верхнем уровне, без обертки "config"
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
            {
                role: "user",
                parts: [{ text: `Мои ингредиенты: ${userText}. Какой рецепт ты предложишь?` }]
            }
        ],
        generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.7
        }
    };

    try {
        // 5. Отправка запроса к Gemini
        const response = await fetch(GEMINI_API_URL + GEMINI_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Обработка ошибок от Google API
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            const errorMessage = errorData.error ? errorData.error.message : `HTTP Error: ${response.status}`;
            
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `Ошибка Gemini API: ${errorMessage}` })
            };
        }

        const data = await response.json();
        
        let chefResponse = "Шеф-повар задумался, но не смог придумать рецепт. Попробуйте другие ингредиенты.";

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            chefResponse = data.candidates[0].content.parts[0].text;
        }

        // 6. Успешный ответ
        return {
            statusCode: 200,
            body: JSON.stringify({ message: chefResponse })
        };

    } catch (error) {
        console.error("Внутренняя ошибка сервера:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Внутренняя ошибка сервера." })
        };
    }
};