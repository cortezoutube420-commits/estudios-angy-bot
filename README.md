# ✝️ Bot Bíblico WhatsApp
### Powered by Groq AI + Green API | Biblia Reina Valera 1960

---

## 💰 COSTO REAL (casi gratis)

| Servicio | Plan Gratis | Límite |
|----------|-------------|--------|
| **Groq AI** | ✅ Gratis | 14,400 req/día · 6,000 tokens/min |
| **Green API** | ✅ Gratis | 1 instancia · sin límite de mensajes |
| **Servidor** | Railway.app | $5/mes (o gratis en Render.com) |
| **Total** | ~$0–$5/mes | Suficiente para uso personal/ministerio |

---

## 🚀 GUÍA DE INSTALACIÓN PASO A PASO

### PASO 1 — Obtener API Key de Groq (IA gratuita)

1. Ve a **https://console.groq.com**
2. Crea una cuenta gratuita
3. Haz clic en **"API Keys"** → **"Create API Key"**
4. Copia la key (empieza con `gsk_`)

### PASO 2 — Configurar Green API (WhatsApp)

1. Ve a **https://green-api.com**
2. Registra una cuenta gratuita
3. Haz clic en **"Create Instance"**
4. Selecciona el plan **Developer (gratis)**
5. Escanea el código QR con tu WhatsApp
6. Guarda el **Instance ID** y el **API Token**

### PASO 3 — Desplegar el Bot

#### Opción A: Railway.app (recomendado — $5/mes)
```bash
# 1. Sube el código a GitHub
# 2. En Railway: New Project → Deploy from GitHub
# 3. Agrega las variables de entorno:
#    GROQ_API_KEY, GREEN_INSTANCE_ID, GREEN_API_TOKEN
# 4. Railway te da una URL pública automáticamente
```

#### Opción B: Render.com (gratis, puede ser lento)
```bash
# 1. En render.com → New Web Service → desde GitHub
# 2. Build Command: npm install
# 3. Start Command: node bot.js
# 4. Agrega variables de entorno igual que Railway
```

#### Opción C: En tu propia PC (con ngrok)
```bash
npm install
cp .env.example .env
# Edita .env con tus API keys
npm start

# En otra terminal:
ngrok http 3000
# Copia la URL https://xxxx.ngrok.io
```

### PASO 4 — Configurar el Webhook

Una vez que tengas tu URL pública, ejecuta:
```bash
# Con la URL de tu servidor:
node setup-webhook.js https://TU-DOMINIO.com/webhook
```

¡Listo! Escribe "hola" a tu WhatsApp y el bot responderá 🙏

---

## 📖 COMANDOS Y EJEMPLOS

El bot entiende lenguaje natural. Algunos ejemplos:

```
"Prédica sobre la fe"
"Estudio del libro de Job"
"Versículo para la depresión"
"Oración por mi matrimonio"
"Explícame Apocalipsis 1"
"Devocional de hoy"
"¿Qué dice la Biblia sobre el dinero?"
"Dame una promesa bíblica"
```

---

## 🔧 PERSONALIZACIÓN

En `bot.js` puedes cambiar:

- **`SYSTEM_PROMPT`**: Cambia la personalidad del pastor
- **`WELCOME_MSG`**: Modifica el mensaje de bienvenida  
- **`GROQ_MODEL`**: Prueba otros modelos gratuitos de Groq:
  - `llama-3.3-70b-versatile` (recomendado)
  - `llama-3.1-8b-instant` (más rápido, menos tokens)
  - `mixtral-8x7b-32768` (contexto largo)

---

## 📊 MONITOREO

Accede a `https://tu-dominio.com/` para ver el estado del bot.

---

## ✝️ ¡Dios bendiga tu ministerio!
