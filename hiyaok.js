/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ❰❰ BOT WHATSAPP - GAME & COIN SYSTEM ❱❱
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Library: @whiskeysockets/baileys
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Mengimpor library yang diperlukan
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  jidDecode
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('./config.js');
const crypto = require('crypto'); // Import 

// Pastikan crypto tersedia secara global (memperbaiki masalah baileys)
global.crypto = crypto;

// Membuat interface untuk input dari terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Lokasi database
const DATABASE_FILE = path.join(__dirname, 'database.json');

// Inisialisasi database
let database = {
  users: {},
  adminNumbers: config.adminNumbers
};

// Flag untuk menandai proses pairing sedang berlangsung
let isPairingInProgress = false;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ❰❰ FUNGSI DATABASE ❱❱
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Fungsi untuk memuat database
function loadDatabase() {
  try {
    if (fs.existsSync(DATABASE_FILE)) {
      const data = fs.readFileSync(DATABASE_FILE, 'utf8');
      const loadedData = JSON.parse(data);
      
      // Pastikan struktur database tetap konsisten setelah dimuat
      database = {
        users: loadedData.users || {},
        adminNumbers: loadedData.adminNumbers || config.adminNumbers
      };
      
      console.log('✅ Database berhasil dimuat');
    } else {
      saveDatabase();
      console.log('✅ Database baru dibuat');
    }
  } catch (error) {
    console.error('❌ Error saat memuat database:', error);
  }
}

// Fungsi untuk menyimpan database
function saveDatabase() {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error saat menyimpan database:', error);
    return false;
  }
}

// Fungsi untuk mendapatkan saldo pengguna
function getUserBalance(userId) {
  if (!database.users[userId]) {
    database.users[userId] = {
      balance: 0
    };
    saveDatabase();
  }
  return database.users[userId].balance;
}

// Fungsi untuk menambah saldo pengguna
function addUserBalance(userId, amount) {
  if (!database.users[userId]) {
    database.users[userId] = {
      balance: 0
    };
  }
  database.users[userId].balance += parseInt(amount);
  saveDatabase();
  return database.users[userId].balance;
}

// Fungsi untuk mengurangi saldo pengguna
function reduceUserBalance(userId, amount) {
  if (!database.users[userId]) {
    database.users[userId] = {
      balance: 0
    };
    saveDatabase();
    return false;
  }
  
  const currentBalance = database.users[userId].balance;
  if (currentBalance < amount) {
    return false; // Saldo tidak cukup
  }
  
  database.users[userId].balance -= parseInt(amount);
  saveDatabase();
  return database.users[userId].balance;
}

// Fungsi untuk transfer coin antar pengguna
function transferCoin(senderId, receiverId, amount) {
  // Cek saldo pengirim
  const senderBalance = getUserBalance(senderId);
  if (senderBalance < amount) {
    return false; // Saldo tidak cukup
  }
  
  // Kurangi saldo pengirim
  reduceUserBalance(senderId, amount);
  
  // Tambah saldo penerima
  const newReceiverBalance = addUserBalance(receiverId, amount);
  
  // Kembalikan saldo pengirim yang baru
  return {
    senderBalance: getUserBalance(senderId),
    receiverBalance: newReceiverBalance
  };
}

// Fungsi untuk format angka
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Fungsi untuk cek apakah nomor adalah admin
function isAdmin(jid) {
  return database.adminNumbers.includes(jid);
}

// Fungsi untuk ekstrak nomor dari pesan atau teks
async function extractNumber(sock, message, args) {
  try {
    // Cek jika ada quoted message (reply)
    if (message.message.extendedTextMessage?.contextInfo?.quotedMessage) {
      return message.message.extendedTextMessage.contextInfo.participant;
    }
    
    // Cek jika ada mention
    if (message.message.extendedTextMessage?.contextInfo?.mentionedJid && 
        message.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
      return message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    
    // Cek jika ada nomor dalam argumen
    if (args && args.length > 0) {
      let phoneNumber = args[0].replace(/[^0-9]/g, '');
      
      // Cek format nomor
      if (!phoneNumber.startsWith('62')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '62' + phoneNumber.substring(1);
        } else if (phoneNumber.startsWith('8')) {
          phoneNumber = '62' + phoneNumber;
        }
      }
      
      return phoneNumber + '@s.whatsapp.net';
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error saat ekstrak nomor:', error);
    return null;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ❰❰ FUNGSI GAME ❱❱
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// Fungsi untuk animasi spin
async function animateSpin(sock, jid, msgId) {
  try {
    const numbers = [19, 20, 1, 18, 33, 17];
    
    // Animasi berputar
    for (let i = 0; i < 5; i++) {
      const text = config.messages.gassAnimationTexts[i];
      await sock.sendMessage(jid, { text }, { quoted: { key: { remoteJid: jid, id: msgId } } });
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Hasil akhir
    const result = numbers[Math.floor(Math.random() * numbers.length)];
    return result;
  } catch (error) {
    console.error('❌ Error saat animasi spin:', error);
    return 1; // Default jika error
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ❰❰ FUNGSI UTAMA WHATSAPP ❱❱
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

async function connectToWhatsApp() {
  // Memuat database
  loadDatabase();
  
  // Menyiapkan autentikasi
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  // Membuat koneksi ke WhatsApp
  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
    },
    browser: [config.botName, 'Chrome', '1.0.0'],
    logger: pino({ level: 'fatal' }).child({ level: 'fatal' })
  });
  
  // Listen for state changes
  sock.ev.on('creds.update', saveCreds);
  
  // Listen for connection events
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log(`✅ Koneksi berhasil! Bot ${config.botName} aktif.`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      isPairingInProgress = false; // Reset pairing flag saat koneksi berhasil
    } else if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect && !isPairingInProgress) {
        console.log('❌ Koneksi tertutup, mencoba menghubungkan kembali...');
        connectToWhatsApp();
      } else if (!shouldReconnect) {
        console.log('❌ Koneksi tertutup, logout terdeteksi. Bot tidak akan mencoba menghubungkan kembali.');
        process.exit(0);
      }
    }
    
    // Cek jika tidak ada sesi tersimpan dan bukan sedang pairing
    if (connection === 'connecting' && !state.creds.me && !isPairingInProgress) {
      isPairingInProgress = true; // Set flag untuk menghindari multiple pairing requests
      
      console.log('📱 Tidak ada sesi tersimpan. Memulai pairing...');
      
      rl.question('Masukkan nomor telepon (format: 628xxx): ', async (phoneNumber) => {
        console.log(`⏳ Menunggu pairing code untuk ${phoneNumber}...`);
        
        try {
          // Tunggu 3 detik sebelum request pairing code
          setTimeout(async () => {
            try {
              const pairingCode = await sock.requestPairingCode(phoneNumber);
              console.log(`📲 Pairing code: ${pairingCode}`);
              console.log('📲 Masukkan kode ini di aplikasi WhatsApp Anda > Perangkat tertaut > Tautkan perangkat');
            } catch (pairingError) {
              console.error('❌ Error saat meminta pairing code:', pairingError);
              isPairingInProgress = false;
              process.exit(1);
            }
          }, 3000);
        } catch (error) {
          console.error('❌ Error global:', error);
          isPairingInProgress = false;
          process.exit(1);
        }
      });
    }
  });
  
  // Handle pesan masuk
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        // Periksa apakah pesan dari pengguna dan bukan status
        if (!message.key.fromMe && message.key.remoteJid !== 'status@broadcast') {
          const senderNumber = message.key.remoteJid;
          const msgId = message.key.id;
          
          // Dapatkan konten pesan
          const messageContent = message.message?.conversation || 
                               message.message?.extendedTextMessage?.text || 
                               message.message?.imageMessage?.caption || 
                               message.message?.videoMessage?.caption || '';
          
          console.log(`📩 Pesan dari ${senderNumber}: ${messageContent}`);
          
          // Cek apakah pesan dimulai dengan prefix
          if (messageContent.startsWith(config.prefix)) {
            const args = messageContent.slice(config.prefix.length).trim().split(' ');
            const command = args.shift().toLowerCase();
            
            // FITUR USER
            // -----------------------------
            
            // Command: .bal - Cek Saldo
            if (command === 'bal') {
              const balance = getUserBalance(senderNumber);
              await sock.sendMessage(senderNumber, { 
                text: config.messages.balance(formatNumber(balance)) 
              }, { quoted: message });
            } 
            
            // Command: .menu - Tampilkan Menu
            else if (command === 'menu') {
              await sock.sendMessage(senderNumber, { 
                image: { url: config.menuImage },
                caption: config.messages.menuMessage,
                jpegThumbnail: null
              }, { quoted: message });
            } 
            
            // Command: .depo - Info Deposit
            else if (command === 'depo') {
              await sock.sendMessage(senderNumber, { 
                text: config.depositMethods 
              }, { quoted: message });
            } 
            
            // Command: .gass - Spin Game (For All Users)
            else if (command === 'gass') {
              // Jalankan animasi dan tampilkan hasil
              const result = await animateSpin(sock, senderNumber, msgId);
              
              // Kirim hasil
              await sock.sendMessage(senderNumber, { 
                text: config.messages.gassResult(result)
              }, { quoted: message });
            }
            
            // Command: .tf - Transfer Coin
            else if (command === 'tf') {
              // Validasi format
              if (args.length < 1) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.transferSyntax 
                }, { quoted: message });
                continue;
              }
              
              // Ekstrak nomor tujuan dan jumlah
              const targetNumber = await extractNumber(sock, message, args);
              const amount = parseInt(args[args.length - 1]);
              
              // Validasi
              if (!targetNumber) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.transferSyntax 
                }, { quoted: message });
                continue;
              }
              
              if (isNaN(amount) || amount <= 0) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.invalidAmount 
                }, { quoted: message });
                continue;
              }
              
              // Proses transfer
              const result = transferCoin(senderNumber, targetNumber, amount);
              if (!result) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.notEnoughBalance 
                }, { quoted: message });
              } else {
                // Kirim konfirmasi ke pengirim
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.transferSuccess(amount, targetNumber, formatNumber(result.senderBalance)),
                  mentions: [targetNumber]
                }, { quoted: message });
                
                // Kirim notifikasi ke penerima
                await sock.sendMessage(targetNumber, { 
                  text: config.messages.transferReceived(amount, senderNumber, formatNumber(result.receiverBalance)),
                  mentions: [senderNumber]
                });
              }
            }
            
            // FITUR ADMIN
            // -----------------------------
            
            // Command: .addcoin - Tambah Coin (Admin Only)
            else if (command === 'addcoin') {
              // Cek apakah pengguna adalah admin
              if (!isAdmin(senderNumber)) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.onlyAdmin 
                }, { quoted: message });
                continue;
              }
              
              // Validasi format
              if (args.length < 1) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.addCoinSyntax 
                }, { quoted: message });
                continue;
              }
              
              // Ekstrak nomor tujuan dan jumlah
              const targetNumber = await extractNumber(sock, message, args);
              const amount = parseInt(args[args.length - 1]);
              
              // Validasi
              if (!targetNumber) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.addCoinSyntax 
                }, { quoted: message });
                continue;
              }
              
              if (isNaN(amount) || amount <= 0) {
                await sock.sendMessage(senderNumber, { 
                  text: config.messages.invalidAmount 
                }, { quoted: message });
                continue;
              }
              
              // Tambahkan coin
              const newBalance = addUserBalance(targetNumber, amount);
              
              // Kirim konfirmasi ke admin
              await sock.sendMessage(senderNumber, { 
                text: config.messages.addCoinSuccess(amount, targetNumber, formatNumber(newBalance)),
                mentions: [targetNumber]
              }, { quoted: message });
              
              // Kirim notifikasi ke user
              await sock.sendMessage(targetNumber, { 
                text: config.messages.coinReceived(amount, formatNumber(newBalance))
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error saat memproses pesan:', error);
      }
    }
  });
}

// Banner startup
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ${config.botName} - WHATSAPP BOT
     Owner: ${config.ownerName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Jalankan fungsi utama
connectToWhatsApp();
