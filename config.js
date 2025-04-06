/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ❰❰ KONFIGURASI BOT WHATSAPP ❱❱
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Konfigurasi Bot
const config = {
  // Info Bot
  botName: '🎮 GAME BOT 🎮',
  ownerName: 'Admin Game',
  
  // Prefix Bot
  prefix: '.',
  
  // Admin Numbers (format: ['628xxx@s.whatsapp.net', '628xxx@s.whatsapp.net'])
  adminNumbers: ['6281280174445@s.whatsapp.net'],
  
  // Gambar untuk menu (base64 atau URL)
  menuImage: 'https://i.ibb.co.com/qF9025kH/IMG-20250406-083643-357.jpg',
  
  // Deposit Methods
  depositMethods: `
╭━━━━『 𝗠𝗘𝗧𝗢𝗗𝗘 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 』━━━━╮
┃
┃ • *GOPAY*: 08123456789
┃ • *DANA*: 08123456789
┃ • *OVO*: 08123456789
┃ • *BCA*: 0123456789
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

  // Pesan & Respons
  messages: {
    balance: (balance) => `╭━━━━『 𝗦𝗔𝗟𝗗𝗢 𝗞𝗔𝗠𝗨 』━━━━╮
┃
┃ • 💰 *Saldo:* ${balance}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    gassResult: (result) => `╭━━━━『 𝗛𝗔𝗦𝗜𝗟 𝗦𝗣𝗜𝗡 』━━━━╮
┃
┃ • 🎲 *Hasil:* ${result}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    gassAnimationTexts: [
      "🎮 *Memutar...* 🎮",
      "🎯 *Berputar...* 🎯",
      "🎲 *Menunggu Hasil...* 🎲",
      "🎪 *Hampir Sampai...* 🎪",
      "🎰 *Siap-siap...* 🎰"
    ],

    transferSuccess: (amount, receiver, balance) => `╭━━━━『 𝗧𝗥𝗔𝗡𝗦𝗙𝗘𝗥 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 』━━━━╮
┃
┃ • 💸 *Jumlah:* ${amount} coin
┃ • 👤 *Ke:* @${receiver.split('@')[0]}
┃ • 💰 *Saldo Sekarang:* ${balance}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    transferReceived: (amount, sender, balance) => `╭━━━━『 𝗖𝗢𝗜𝗡 𝗗𝗜𝗧𝗘𝗥𝗜𝗠𝗔 』━━━━╮
┃
┃ • 💸 *Jumlah:* ${amount} coin
┃ • 👤 *Dari:* @${sender.split('@')[0]}
┃ • 💰 *Saldo Sekarang:* ${balance}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    addCoinSuccess: (amount, user, balance) => `╭━━━━『 𝗔𝗗𝗗 𝗖𝗢𝗜𝗡 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 』━━━━╮
┃
┃ • ✅ *Ditambahkan:* ${amount} coin
┃ • 👤 *User:* @${user.split('@')[0]}
┃ • 💰 *Saldo Sekarang:* ${balance}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    coinReceived: (amount, balance) => `╭━━━━『 𝗖𝗢𝗜𝗡 𝗗𝗜𝗧𝗔𝗠𝗕𝗔𝗛𝗞𝗔𝗡 』━━━━╮
┃
┃ • ✅ *Ditambahkan:* ${amount} coin
┃ • 💰 *Saldo Sekarang:* ${balance}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`,

    menuMessage: `╭━━━━『 𝗙𝗜𝗧𝗨𝗥 𝗕𝗢𝗧 』━━━━╮
┃
┃ ≻ *USER COMMANDS*
┃ • .bal - Cek saldo coin
┃ • .menu - Tampilkan menu bot
┃ • .gass - Main game spin
┃ • .tf [tag/reply/nomor] [jumlah] - Transfer coin
┃ • .depo - Metode deposit
┃
┃ ≻ *ADMIN COMMANDS*
┃ • .addcoin [tag/reply/nomor] [jumlah] - Tambah coin
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

*NOTE:* Hubungi admin untuk melakukan deposit`,

    notEnoughBalance: `❌ *Saldo kamu tidak cukup untuk transfer*`,
    invalidAmount: `❌ *Jumlah tidak valid. Masukkan angka yang benar*`,
    transferSyntax: `❌ *Format salah!* Gunakan:
• .tf [tag] [jumlah]
• .tf [reply] [jumlah]
• .tf [nomor] [jumlah]`,
    addCoinSyntax: `❌ *Format salah!* Gunakan:
• .addcoin [tag] [jumlah]
• .addcoin [reply] [jumlah]
• .addcoin [nomor] [jumlah]`,
    onlyAdmin: `❌ *Maaf, hanya admin yang dapat menggunakan fitur ini*`
  }
};

module.exports = config;
