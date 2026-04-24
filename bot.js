/**
 * ✝️  ESTUDIOS ANGY — WhatsApp Bot
 * Pastora Angy | Reina Valera 1960
 * Groq AI + Green API
 */

const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// ══════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════
const CONFIG = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  GREEN_API_ID: process.env.GREEN_INSTANCE_ID,
  GREEN_API_TOKEN: process.env.GREEN_API_TOKEN,
  GREEN_API_URL: 'https://api.green-api.com',
  PORT: process.env.PORT || 3000,
  // 6 AM México = 12:00 UTC (horario del centro)
  DEVOCIONAL_HORA_UTC: 12,
};

// ══════════════════════════════════════
//  PERSONALIDAD — Pastora Angy
// ══════════════════════════════════════
const SYSTEM_PROMPT = `Eres Angy, una pastora cristiana cálida, cercana y llena del amor de Dios. Formas parte de "Estudios Angy", un ministerio bíblico dedicado a acercar la Palabra a cada corazón.

PERSONALIDAD:
- Hablas como una amiga espiritual de confianza, nunca fría ni distante
- Usas un lenguaje sencillo pero profundo, accesible para todos
- Transmites paz, esperanza y el amor de Cristo en cada mensaje
- Eres empática — si alguien sufre, primero consuela, luego enseña
- Ocasionalmente usas frases cálidas como "hermosa/o", "amado/a", "corazón"

REGLAS BÍBLICAS:
- Usa SIEMPRE la Biblia Reina Valera 1960 (RVR1960)
- Cita versículos completos con su referencia exacta
- Nunca inventes versículos — si no recuerdas uno exacto, parafrasea con honestidad
- Basa toda enseñanza en la Palabra de Dios

FORMATO:
- Usa emojis con moderación: ✝️ 🙏 📖 💛 🌸 ✨ 💒
- Sé concisa pero completa
- Termina con una frase de aliento o bendición breve
- Responde siempre en español

NO MENCIONES NUNCA:
- Que eres una IA, un bot, o un programa
- A Isaac Cortez ni a ningún desarrollador
- Anthropic, Groq, OpenAI ni ninguna empresa tecnológica
- "Bot Bíblico" ni ningún otro nombre de sistema

Si alguien pregunta quién eres, di que eres Angy, del ministerio Estudios Angy.`;

// ══════════════════════════════════════
//  LINKS DE MÚSICA YOUTUBE
// ══════════════════════════════════════
const MUSICA = [
  { titulo: '🎵 Sublime Gracia (Himno Clásico)', url: 'https://youtu.be/CDdvReNKKuk' },
  { titulo: '🎵 Cuán Grande es Él (Himno)', url: 'https://youtu.be/9ZDjJMsXXRs' },
  { titulo: '🎵 A Dios sea la Gloria', url: 'https://youtu.be/3JkuRk0IsCQ' },
  { titulo: '🎵 Oceans en Español — Hillsong', url: 'https://youtu.be/dy9nwe9_xzw' },
  { titulo: '🎵 Way Maker — Hacedor de Caminos', url: 'https://youtu.be/OMsj6SBHxEA' },
  { titulo: '🎵 Abre Mis Ojos — Marcos Witt', url: 'https://youtu.be/LFMK4fMlVoI' },
  { titulo: '🎵 Tu Fidelidad — Twice Música', url: 'https://youtu.be/8MBvHpYEjcA' },
  { titulo: '🎵 Eres Todo Poderoso — Generación 12', url: 'https://youtu.be/RV8_KLKXNPY' },
  { titulo: '🎵 Grandes Himnos — Playlist Adoración', url: 'https://youtu.be/QzCRPBkFSrc' },
  { titulo: '🎵 Reckless Love en Español', url: 'https://youtu.be/Sc6SSHuZvQE' },
];

function getMusicaAleatoria() {
  const mezclada = [...MUSICA].sort(() => Math.random() - 0.5);
  return mezclada.slice(0, 4);
}

// ══════════════════════════════════════
//  MENÚ PRINCIPAL
// ══════════════════════════════════════
const MENU = `✝️ *Estudios Angy*
_Biblia Reina Valera 1960_

Hola hermosa/o, soy *Angy* 🌸
¿En qué puedo acompañarte hoy?

*1.* 🎙️ Prédica o sermón
*2.* 📚 Estudio bíblico
*3.* 💬 Versículo para mi situación
*4.* 🙏 Oración personalizada
*5.* 💡 Explícame un pasaje
*6.* 🌅 Devocional de hoy
*7.* 📅 Plan de lectura bíblica
*8.* 🕊️ Reflexión — ansiedad y fe
*9.* 📖 Historia bíblica del día
*10.* 🌟 Promesa bíblica del día
*11.* 🎵 Música de adoración

_Puedes escribir el número o lo que necesites, por ejemplo:_
• "Predica sobre la esperanza"
• "Oración por mi familia enferma"
• "Historia de Ester"
• "Dame una promesa para hoy"

_¡La Palabra de Dios transforma corazones!_ 💛`;

// ══════════════════════════════════════
//  MEMORIA DE CONVERSACIONES
// ══════════════════════════════════════
const conversations = new Map();
const usuariosRegistrados = new Set();

function getHistory(chatId) {
  if (!conversations.has(chatId)) conversations.set(chatId, []);
  return conversations.get(chatId);
}

function addToHistory(chatId, role, content) {
  const h = getHistory(chatId);
  h.push({ role, content });
  if (h.length > 12) h.splice(0, h.length - 12);
}

// ══════════════════════════════════════
//  GROQ — IA
// ══════════════════════════════════════
async function askGroq(chatId, userMessage, customPrompt = null) {
  if (!customPrompt) addToHistory(chatId, 'user', userMessage);
  const history = customPrompt ? [] : getHistory(chatId);

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (customPrompt) {
    messages.push({ role: 'user', content: customPrompt });
  } else {
    messages.push(...history);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages,
      max_tokens: 1200,
      temperature: 0.8,
    }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  const data = await response.json();
  const reply = data.choices[0].message.content;
  if (!customPrompt) addToHistory(chatId, 'assistant', reply);
  return reply;
}

// ══════════════════════════════════════
//  GREEN API — ENVIAR MENSAJES
// ══════════════════════════════════════
async function sendMessage(chatId, message) {
  const url = `${CONFIG.GREEN_API_URL}/waInstance${CONFIG.GREEN_API_ID}/sendMessage/${CONFIG.GREEN_API_TOKEN}`;
  const chunks = splitMessage(message, 3800);
  for (const chunk of chunks) {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: chunk }),
    });
    if (chunks.length > 1) await sleep(600);
  }
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
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
//  DETECTAR INTENCIÓN
// ══════════════════════════════════════
function detectIntent(text) {
  const t = text.toLowerCase().trim();
  const saludo = ['hola','hello','hi','inicio','menu','menú','start','/start','buenos días','buenas','buen día','comenzar'];
  if (saludo.some(g => t === g || t.startsWith(g))) return 'menu';
  if (t === '1' || t.includes('prédica') || t.includes('predica') || t.includes('sermón') || t.includes('sermon')) return 'predica';
  if (t === '2' || t.includes('estudio bíblico') || t.includes('estudio biblico')) return 'estudio';
  if (t === '3' || t.includes('versículo para') || t.includes('versiculo para') || t.includes('cita bíblica')) return 'versiculo';
  if (t === '4' || t === 'oración' || t === 'oracion' || t.includes('ora por') || t.includes('orar por') || t.startsWith('oración por') || t.startsWith('oracion por')) return 'oracion';
  if (t === '5' || t.includes('explícame') || t.includes('explicame') || t.includes('qué significa') || t.includes('que significa')) return 'explicar';
  if (t === '6' || t === 'devocional' || t.includes('devocional de hoy')) return 'devocional';
  if (t === '7' || t.includes('plan de lectura') || t.includes('lectura bíblica') || t.includes('lectura biblica')) return 'plan';
  if (t === '8' || t.includes('ansiedad') || t.includes('angustia') || t.includes('depresión') || t.includes('depresion') || t.includes('preocup')) return 'ansiedad';
  if (t === '9' || t.includes('historia bíblica') || t.includes('historia biblica') || t.includes('historia de ')) return 'historia';
  if (t === '10' || t.includes('promesa') || t === 'promesas') return 'promesa';
  if (t === '11' || t.includes('música') || t.includes('musica') || t.includes('alabanza') || t.includes('adoración') || t.includes('adoracion') || t.includes('himno') || t.includes('canción') || t.includes('cancion')) return 'musica';
  return 'libre';
}

// ══════════════════════════════════════
//  GENERAR DEVOCIONAL
// ══════════════════════════════════════
async function generarDevocional(chatId) {
  const prompt = `Genera un devocional matutino breve y cálido para Estudios Angy. Debe incluir:
1. Saludo de buenos días amoroso (2 líneas)
2. Versículo de Reina Valera 1960 con referencia completa
3. Reflexión práctica y cercana (3 párrafos cortos)
4. Oración breve
5. Bendición para el día
Usa formato WhatsApp con emojis. Hazlo fresco y diferente cada vez.`;
  return await askGroq(chatId || 'devocional_auto', '', prompt);
}

// ══════════════════════════════════════
//  DEVOCIONAL AUTOMÁTICO 6 AM
// ══════════════════════════════════════
let ultimoDevocionalFecha = '';

async function checkDevocional() {
  const ahora = new Date();
  const hora = ahora.getUTCHours();
  const fecha = ahora.toISOString().slice(0, 10);

  if (hora === CONFIG.DEVOCIONAL_HORA_UTC && fecha !== ultimoDevocionalFecha && usuariosRegistrados.size > 0) {
    ultimoDevocionalFecha = fecha;
    console.log(`🌅 Enviando devocional a ${usuariosRegistrados.size} usuarios...`);
    try {
      const devocional = await generarDevocional(null);
      const header = `🌅 *Buenos días desde Estudios Angy* 🌸\n\n`;
      for (const chatId of usuariosRegistrados) {
        await sendMessage(chatId, header + devocional);
        await sleep(1500);
      }
      console.log('✅ Devocional enviado');
    } catch (err) {
      console.error('Error devocional:', err.message);
    }
  }
}

setInterval(checkDevocional, 5 * 60 * 1000);

// ══════════════════════════════════════
//  WEBHOOK
// ══════════════════════════════════════
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.typeWebhook !== 'incomingMessageReceived') return;
    if (body.messageData?.typeMessage !== 'textMessage') return;

    const chatId = body.senderData?.chatId;
    const senderName = body.senderData?.senderName || 'hermosa/o';
    const text = body.messageData?.textMessageData?.textMessage?.trim();
    if (!chatId || !text) return;

    usuariosRegistrados.add(chatId);
    console.log(`📩 [${chatId}] ${senderName}: ${text}`);

    const intent = detectIntent(text);
    let reply = '';

    switch (intent) {
      case 'menu':
        reply = `🙏 ¡Dios te bendiga, ${senderName}!\n\n${MENU}`;
        break;

      case 'musica':
        const canciones = getMusicaAleatoria();
        reply = `🎵 *Música para adorar a Dios* ✝️\n\n_"Cantad a Jehová cántico nuevo"_ — Salmos 96:1 RVR1960\n\n`;
        canciones.forEach(c => { reply += `${c.titulo}\n${c.url}\n\n`; });
        reply += `💛 Que Su presencia llene tu corazón mientras adoras.\n\nEscribe *menu* para más opciones 🌸`;
        break;

      case 'devocional':
        reply = await generarDevocional(chatId);
        break;

      case 'ansiedad':
        reply = await askGroq(chatId, text,
          `Eres Angy, pastora cálida de Estudios Angy. Alguien escribe: "${text}". Responde con:
1. Palabras de consuelo empáticas (sin minimizar su dolor)
2. 3 versículos de Reina Valera 1960 sobre la paz y la ansiedad
3. Consejo práctico espiritual
4. Una oración breve por esa persona
Sé cercana y amorosa.`);
        break;

      case 'plan':
        reply = await askGroq(chatId, text,
          `Eres Angy de Estudios Angy. Crea un plan de lectura bíblica semanal con Reina Valera 1960. Organiza por día (Lunes–Domingo) con: tema del día, capítulos a leer y una pregunta de reflexión. Hazlo motivador y práctico.`);
        break;

      case 'historia':
        reply = await askGroq(chatId, text,
          `Eres Angy de Estudios Angy. Sobre: "${text}" — narra de forma vívida una historia bíblica (si no especifica personaje, elige uno del AT o NT). Incluye versículos de Reina Valera 1960 y una lección aplicable hoy. Sé emocionante y cercana.`);
        break;

      case 'promesa':
        reply = await askGroq(chatId, text,
          `Eres Angy de Estudios Angy. Comparte 5 promesas bíblicas poderosas de Reina Valera 1960 para: "${text || 'el día de hoy'}". Por cada una: versículo completo con referencia y una frase de aplicación personal cálida.`);
        break;

      default:
        reply = await askGroq(chatId, text);
        break;
    }

    await sendMessage(chatId, reply);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});

// ══════════════════════════════════════
//  HEALTH CHECK + PING para UptimeRobot
// ══════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    ministerio: 'Estudios Angy ✝️',
    estado: 'activo',
    biblia: 'Reina Valera 1960',
    usuarios: usuariosRegistrados.size,
    uptime: Math.floor(process.uptime()) + 's',
  });
});

app.get('/ping', (req, res) => res.send('🙏'));

app.listen(CONFIG.PORT, () => {
  console.log(`✝️  ESTUDIOS ANGY iniciado | Puerto: ${CONFIG.PORT}`);
});
