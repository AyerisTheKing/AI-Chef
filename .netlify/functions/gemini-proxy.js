/* gemini-proxy.js v1.1 | 04.12.2025 | ДОБАВЛЕНА ЛОГИКА ОБРАБОТКИ CORS */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
const SYSTEM_PROMPT = "Ты — опытный шеф-повар и кулинарный эксперт AI Chef. Твоя задача — подбирать рецепты только по тем ингредиентам, которые назвал пользователь. Отвечай дружелюбно, уверенно и профессионально. Всегда указывай название блюда, список ингредиентов и краткую инструкцию по приготовлению.";

// 1. Определяем заголовки для разрешения CORS
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://ayeristheking.github.io', // <--- Разрешает только ваш фронтенд на GitHub Pages
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // <--- Разрешает методы POST и OPTIONS
    'Access-Control-Allow-Headers': 'Content-Type', // <--- Разрешает заголовок Content-Type
};

// Главный обработчик Serverless Function Netlify
exports.handler = async (event) => {
    
    // --- НОВОЕ: Обработка предварительного (preflight) OPTIONS-запроса ---
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: CORS_HEADERS, // Просто возвращаем CORS-заголовки
            body: '' // Тело ответа не требуется
        };
    }
    // --------------------------------------------------------------------

    // 1. Получаем ключ из переменных окружения Netlify. 
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS, // Всегда возвращаем CORS-заголовки
            body: JSON.stringify({ message: "Ошибка конфигурации: ключ API (GEMINI_API_KEY) не найден." })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers: CORS_HEADERS, // Всегда возвращаем CORS-заголовки
            body: "Метод не разрешен. Используйте POST." 
        };
    }

    let userText;
    try {
        const body = JSON.parse(event.body);
        userText = body.userText;
    } catch (e) {
        return { 
            statusCode: 400, 
            headers: CORS_HEADERS, // Всегда возвращаем CORS-заголовки
            body: "Неверный формат JSON тела запроса." 
        };
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
                headers: CORS_HEADERS, // ВСЕГДА ДОБАВЛЯЕМ
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
            headers: CORS_HEADERS, // ВСЕГДА ДОБАВЛЯЕМ
            body: JSON.stringify({ message: chefResponse })
        };

    } catch (error) {
        console.error("Произошла ошибка запроса:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS, // ВСЕГДА ДОБАВЛЯЕМ
            body: JSON.stringify({ message: "Произошла внутренняя ошибка сервера. Проверьте логи Netlify." })
        };
    }
};