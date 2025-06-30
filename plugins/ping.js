
async function cmd({ sock, m, command }) {
  if (command === 'ping') {
    const start = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' }, { quoted: m });
    const end = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: `⏱ ${end - start}ms` }, { quoted: m });
  }
}
module.exports = { cmd };
