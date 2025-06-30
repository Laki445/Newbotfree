
async function cmd({ sock, m, command }) {
  if (command === 'alive') {
    await sock.sendMessage(m.key.remoteJid, { text: '✅ I am alive!' }, { quoted: m });
  }
}
module.exports = { cmd };
