/**
 * Configura el webhook de Green API
 * Uso: node setup-webhook.js https://tu-dominio.com/webhook
 */

require('dotenv').config();
const fetch = require('node-fetch');

const INSTANCE_ID = process.env.GREEN_INSTANCE_ID;
const API_TOKEN   = process.env.GREEN_API_TOKEN;
const webhookUrl  = process.argv[2];

if (!webhookUrl) {
  console.error('❌ Uso: node setup-webhook.js https://tu-dominio.com/webhook');
  process.exit(1);
}

(async () => {
  const url = `https://api.green-api.com/waInstance${INSTANCE_ID}/setSettings/${API_TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookUrl,
      incomingWebhook: 'yes',
      outgoingWebhook: 'no',
      outgoingAPIMessageWebhook: 'no',
      delaySendMessagesMilliseconds: 500,
    }),
  });
  const data = await res.json();
  if (data.saveData) {
    console.log(`✅ Webhook configurado correctamente en: ${webhookUrl}`);
  } else {
    console.log('❌ Error al configurar webhook:', data);
  }
})();
