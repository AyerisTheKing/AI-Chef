/* gemini-proxy.js v1.0 | 30.11.2025 | Serverless Proxy для защиты ключа */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

// Главный обработчик Serverless Function Netlify
exports.handler = async (event) => {
    
    // 1. Получаем ключ из переменных окружения Netlify. 
    // (Этот ключ будет установлен позже в настройках Netlify.)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ошибка конфигурации: ключ API (GEMINI_API_KEY) не найден на сервере Netlify. Установите его в настройках." })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Метод не разрешен. Используйте POST." };
    }

    let userText;
    try {
        const body = JSON.parse(event.body);
        userText = body.userText;
    } catch (e) {
        return { statusCode: 400, body: "Неверный формат JSON тела запроса." };
    }

    // Формирование тела запроса к Google Gemini API
    const requestBody = {
        config: {
            systemInstruction: SYSTEM_PROMPT 
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
        // Выполняем запрос БЕЗОПАСНО с сервера
        const response = await fetch(GEMINI_API_URL + GEMINI_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : `HTTP Error: ${response.status}`;
            
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `Ошибка Gemini API: ${errorMessage}` })
            };
        }

        const data = await response.json();
        
        let chefResponse = "Шеф-повар в замешательстве. Попробуйте уточнить список продуктов.";

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            chefResponse = data.candidates[0].content.parts[0].text;
        }

        // Отправляем чистый ответ обратно фронтенду
        return {
            statusCode: 200,
            body: JSON.stringify({ message: chefResponse })
        };

    } catch (error) {
        console.error("Произошла ошибка запроса:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Произошла внутренняя ошибка сервера. Проверьте логи Netlify." })
        };
    }
};