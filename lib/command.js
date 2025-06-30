
const fs = require('fs');
const path = require('path');
const plugins = [];

const pluginFiles = fs.readdirSync(path.join(__dirname, '../plugins')).filter(f => f.endsWith('.js'));
for (const file of pluginFiles) {
  const plugin = require(path.join(__dirname, '../plugins', file));
  if (typeof plugin.cmd === 'function') plugins.push(plugin);
}

async function cmd(sock, m) {
  if (!m.message || !m.key || m.key.fromMe) return;
  const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
  const prefix = '.';
  if (!body.startsWith(prefix)) return;

  const [command, ...args] = body.slice(1).trim().split(/\s+/);
  const text = args.join(' ');
  const sender = m.key.participant || m.key.remoteJid;

  for (const plugin of plugins) {
    try {
      await plugin.cmd({ sock, m, body, command, args, text, sender });
    } catch (e) {
      console.error('[PLUGIN ERROR]', e);
    }
  }
}
module.exports = { cmd };
