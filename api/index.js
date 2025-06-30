
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { cmd } = require('./lib/command');
const fs = require('fs');

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: ['VercelBot', 'Vercel', '1.0'],
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation?.toLowerCase() || '';

    if (body === 'pair') {
      const jid = m.key.remoteJid;
      const phone = jid.split('@')[0];
      const code = await sock.requestPairingCode(phone);
    await sock.sendMessage(phone + "@s.whatsapp.net", { text: "🤖 Bot connected successfully!\nSend .alive or .ping to test." });
      await sock.sendMessage(jid, { text: `🔐 Pairing Code: ${code}` });
      return;
    }

    await cmd(sock, m);
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSock();
    }
    if (connection === 'open') {
      console.log('✅ Bot connected using pairing code.');
    }
  });
}
startSock();

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const port = process.env.PORT || 3000;

app.post('/pair', async (req, res) => {
  const phone = req.body.phone;
  if (!phone || !/^\d{9,15}$/.test(phone)) return res.send('❌ Invalid number');
  try {
    const code = await sock.requestPairingCode(phone);
    await sock.sendMessage(phone + "@s.whatsapp.net", { text: "🤖 Bot connected successfully!\nSend .alive or .ping to test." });
    res.send(`✅ Pairing Code sent to ${phone}: ${code}`);
  } catch (e) {
    console.error('Error sending code:', e);
    res.send('❌ Failed to send code');
  }
});

module.exports = app;
