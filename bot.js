/**
 * ✝️  BOT BÍBLICO WHATSAPP
 * Groq (IA gratuita) + Green API (WhatsApp gratuita)
 * Biblia Reina Valera 1960
 */

const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// ══════════════════════════════════════
//  CONFIGURACIÓN — edita estos valores
// ══════════════════════════════════════
const CONFIG = {
  // Groq — gratis en https://console.groq.com
  GROQ_API_KEY: process.env.GROQ_API_KEY || 'TU_GROQ_API_KEY',
  GROQ_MODEL: 'llama-3.3-70b-versatile',   // modelo gratuito y potente

  // Green API — plan gratuito en https://green-api.com
  GREEN_API_ID: process.env.GREEN_INSTANCE_ID || 'TU_INSTANCE_ID',
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN || 'TU_API_TOKEN',
  GREEN_API_URL: 'https://api.green-api.com',

  PORT: process.env.PORT || 3000,
};

// ══════════════════════════════════════
//  PROMPTS DEL SISTEMA — Reina Valera
// ══════════════════════════════════════
const SYSTEM_PROMPT = `Eres un pastor cristiano devoto y sabio llamado "Heraldo", especializado en la Biblia Reina Valera 1960 (RVR1960). 

REGLAS IMPORTANTES:
1. Usa SIEMPRE la versión Reina Valera 1960 para todas las citas bíblicas
2. Cuando cites un versículo, escríbelo completo con su referencia exacta (ej: Juan 3:16 RVR1960)
3. Responde con calidez pastoral, amor cristiano y profundidad espiritual
4. Sé conciso pero completo — adapta el largo al tipo de solicitud
5. Usa emojis bíblicos ocasionalmente: ✝️ 🙏 📖 ✨ 💒
6. Responde siempre en español

CAPACIDADES:
- Dar prédicas o sermones sobre cualquier tema bíblico
- Compartir estudios bíblicos de un libro, capítulo o tema
- Dar citas bíblicas relacionadas a situaciones de la vida
- Orar (dar oraciones escritas para situaciones específicas)
- Explicar pasajes difíciles o doctrina cristiana
- Dar devocionales diarios
- Responder preguntas sobre la fe cristiana

Cuando no entiendes la solicitud, pide amablemente que la aclare.`;

// ══════════════════════════════════════
//  MENÚ DE BIENVENIDA
// ══════════════════════════════════════
const WELCOME_MSG = `✝️ *¡Bienvenido al Bot Bíblico!*
_Biblia Reina Valera 1960_

Soy *Heraldo*, tu asistente pastoral con IA. ¿En qué puedo ministrar hoy?

📖 *ESCRIBE O ENVÍA:*

*1.* 🎙️ Prédica sobre [tema]
*2.* 📚 Estudio de [libro/tema]
*3.* 💬 Cita bíblica para [situación]
*4.* 🙏 Oración por [motivo]
*5.* 💡 Explícame [pasaje o doctrina]
*6.* 🌅 Devocional de hoy
*7.* ❓ Cualquier pregunta bíblica

_Ejemplos:_
• "Predica sobre la fe"
• "Oración por mi familia"
• "Versículo para la ansiedad"
• "Explícame Juan 1"

*¡La Palabra de Dios está viva y es poderosa!* ⚡
`;

// ══════════════════════════════════════
//  MEMORIA DE CONVERSACIONES
// ══════════════════════════════════════
const conversations = new Map();

function getHistory(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }
  return conversations.get(chatId);
}

function addToHistory(chatId, role, content) {
  const history = getHistory(chatId);
  history.push({ role, content });
  // Mantener solo los últimos 10 mensajes para ahorrar tokens
  if (history.length > 10) history.splice(0, history.length - 10);
}

// ══════════════════════════════════════
//  GROQ — IA GRATUITA
// ══════════════════════════════════════
async function askGroq(chatId, userMessage) {
  addToHistory(chatId, 'user', userMessage);
  const history = getHistory(chatId);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
      ],
      max_tokens: 1500,
      temperature: 0.75,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const reply = data.choices[0].message.content;
  addToHistory(chatId, 'assistant', reply);
  return reply;
}

// ══════════════════════════════════════
//  GREEN API — ENVIAR MENSAJES
// ══════════════════════════════════════
async function sendMessage(chatId, message) {
  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_ID}/sendMessage/${CONFIG.GREEN_API_TOKEN}`;

  // WhatsApp permite ~4096 chars; dividir si es necesario
  const chunks = splitMessage(message, 3800);

  for (const chunk of chunks) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: chunk }),
    });
    if (!res.ok) {
      console.error('Green API error:', await res.text());
    }
    // Pequeña pausa entre mensajes largos
    if (chunks.length > 1) await sleep(500);
  }
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    // Cortar en salto de línea si es posible
    let end = Math.min(i + maxLen, text.length);
    if (end < text.length) {
      const lastNL = text.lastIndexOf('\n', end);
      if (lastNL > i) end = lastNL;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════
//  DETECTAR PALABRAS CLAVE
// ══════════════════════════════════════
function isGreeting(text) {
  const greetings = ['hola', 'hello', 'hi', 'buenos', 'buenas', 'menu', 'menú', 'inicio', 'start', '/start'];
  return greetings.some(g => text.toLowerCase().includes(g));
}

// ══════════════════════════════════════
//  WEBHOOK — RECIBE MENSAJES DE WHATSAPP
// ══════════════════════════════════════
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responder rápido a Green API

  try {
    const body = req.body;

    // Solo procesar mensajes entrantes de texto
    if (body.typeWebhook !== 'incomingMessageReceived') return;
    if (body.messageData?.typeMessage !== 'textMessage') return;

    const chatId = body.senderData?.chatId;
    const senderName = body.senderData?.senderName || 'Hermano/a';
    const text = body.messageData?.textMessageData?.textMessage?.trim();

    if (!chatId || !text) return;

    console.log(`📩 [${chatId}] ${senderName}: ${text}`);

    // Saludo / menú
    if (isGreeting(text)) {
      await sendMessage(chatId, `🙏 ¡Dios te bendiga, ${senderName}!\n\n${WELCOME_MSG}`);
      return;
    }

    // Indicador de "escribiendo..."
    // (Green API no tiene typing indicator en plan free, pero se puede agregar)

    // Llamar a Groq
    const reply = await askGroq(chatId, text);
    console.log(`📤 [${chatId}] Respuesta: ${reply.slice(0, 80)}...`);
    await sendMessage(chatId, reply);

  } catch (err) {
    console.error('Error en webhook:', err.message);
  }
});

// ══════════════════════════════════════
//  CONFIGURAR WEBHOOK EN GREEN API
// ══════════════════════════════════════
async function setWebhook(webhookUrl) {
  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_ID}/setSettings/${CONFIG.GREEN_API_TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookUrl,
      incomingWebhook: 'yes',
      outgoingWebhook: 'no',
      outgoingAPIMessageWebhook: 'no',
    }),
  });
  const data = await res.json();
  console.log('✅ Webhook configurado:', data);
}

// ══════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'Bot Bíblico ✝️',
    model: CONFIG.GROQ_MODEL,
    biblia: 'Reina Valera 1960',
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ══════════════════════════════════════
//  INICIO
// ══════════════════════════════════════
app.listen(CONFIG.PORT, () => {
  console.log(`
✝️  ══════════════════════════════════
   BOT BÍBLICO — Reina Valera 1960
   Puerto: ${CONFIG.PORT}
   Groq: ${CONFIG.GROQ_MODEL}
══════════════════════════════════ ✝️

💡 Para configurar el webhook ejecuta:
   node setup-webhook.js https://TU-DOMINIO.com/webhook
  `);
});

module.exports = { setWebhook };
