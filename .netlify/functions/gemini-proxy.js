/* gemini-proxy.js v1.2 | FIX: Структура JSON для Google API */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

exports.handler = async (event) => {
    
    // Проверка метода (CORS теперь обрабатывается через файл _headers)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Метод не разрешен. Используйте POST." };
    }

    // 1. Получаем ключ API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ошибка конфигурации: ключ API не найден." })
        };
    }

    // 2. Парсим запрос пользователя
    let userText;
    try {
        const body = JSON.parse(event.body);
        userText = body.userText;
    } catch (e) {
        return { statusCode: 400, body: "Неверный формат JSON." };
    }

    // 3. Формирование тела запроса (ИСПРАВЛЕНО: удален блок 'config')
    const requestBody = {
        // System instruction теперь на верхнем уровне в специальном формате
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
        // 4. Отправляем запрос к Gemini
        const response = await fetch(GEMINI_API_URL + GEMINI_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Если Google вернул ошибку
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : `HTTP Error: ${response.status}`;
            console.error("Gemini API Error:", errorMessage);
            
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `Ошибка Gemini API: ${errorMessage}` })
            };
        }

        const data = await response.json();
        
        let chefResponse = "Шеф-повар задумался, но не смог придумать рецепт.";

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            chefResponse = data.candidates[0].content.parts[0].text;
        }

        // 5. Успешный ответ
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