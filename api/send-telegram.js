// api/send-telegram.js (для Vercel)
export default async function handler(req, res) {
  // CORS заголовки для дозволу запитів з вашого Webflow сайту
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка preflight запиту
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Дозволяємо тільки POST запити
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // Отримуємо токен і chatId із змінних середовища (безпечно!)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Перевірка наявності необхідних даних
    if (!message) {
      return res.status(400).json({ 
        error: 'Missing required field: message' 
      });
    }

    if (!botToken || !chatId) {
      console.error('Missing environment variables:', {
        botToken: !!botToken,
        chatId: !!chatId
      });
      return res.status(500).json({ 
        error: 'Server configuration error: missing bot credentials' 
      });
    }

    console.log('Sending message to Telegram:', {
      chatId: chatId,
      messageLength: message.length
    });

    // Конвертуємо Markdown в HTML для кращого відображення
    const htmlMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // **bold** -> <b>bold</b>
      .replace(/\*(.*?)\*/g, '<i>$1</i>')      // *italic* -> <i>italic</i>
      .replace(/\n/g, '\n');                    // зберігаємо переноси рядків

    // Відправка повідомлення в Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      }),
    });

    const telegramResult = await telegramResponse.json();

    console.log('Telegram API Response:', telegramResult);

    if (telegramResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Message sent successfully',
        telegram_message_id: telegramResult.result.message_id
      });
    } else {
      console.error('Telegram API Error:', telegramResult);
      return res.status(400).json({ 
        error: 'Failed to send message to Telegram',
        details: telegramResult.description || 'Unknown Telegram API error'
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}
