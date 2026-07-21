import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const rawKey = process.env.GROQ_API_KEY || '';
    const apiKey = rawKey.trim().replace(/[^\x00-\x7F]/g, '');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY не найден' }, { status: 500 });
    }

    const userMsgs = messages.filter((m: any) => m.role === 'user');
    const lastUserMsg = userMsgs[userMsgs.length - 1]?.content || 'Бизнес-запрос';

    const systemPrompt = `Ты — профессиональный коммерческий копирайтер.
Твоя задача: на основе данных пользователя напиши крутой, продающий пост.
Структура ответа (строго соблюдай JSON):
{
  "title": "Цепляющий заголовок на русском",
  "body": "Основной текст поста. Формула: Боль -> Решение -> Выгода. Обязательно используй эмодзи.",
  "call_to_action": "Четкий призыв к действию",
  "visual_prompt": "Детальный промпт для генерации картинки и видео на английском языке"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: lastUserMsg }
        ],
        temperature: 0.75,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    const aiReply = data.choices[0]?.message?.content || '';
    let finalContent;

    try {
      finalContent = JSON.parse(aiReply);
    } catch (e) {
      const cleanedText = aiReply.replace(/\*\*/g, '').trim();
      const lines = cleanedText.split('\n').filter(l => l.trim() !== '');
      finalContent = {
        title: lines[0] || "Ваш идеальный контент",
        body: cleanedText,
        call_to_action: "Переходите по ссылке, чтобы узнать больше!",
        visual_prompt: "Professional business lifestyle photography, high quality, 8k, cinematic lighting"
      };
    }

    return NextResponse.json({
      status: 'completed',
      final_output: finalContent
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
