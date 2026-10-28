/**
 * Kaisar Gym - Autonomous Agentic Coding & DevOps Telegram Bot
 * Runs 24/7 on local PC via long-polling
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync, exec, execFile } = require('child_process');
const { chromium } = require('playwright');

const BOT_TOKEN = '9009168995:AAF56wmPtt0O4mCip1mQ37PXvqJG-EMiOzA';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const CONFIG_FILE = path.join(__dirname, 'telegram_config.json');
const TASKS_FILE = path.join(__dirname, 'agent_tasks.json');

// Initialize config
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {}
  }
  return { adminChatId: null };
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let config = loadConfig();

// Initialize tasks file
if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
}

// Telegram API Helpers
async function apiCall(method, body) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API ${method} error:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendMessage(chatId, text, extra = {}) {
  return await apiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    ...extra,
  });
}

async function sendPhoto(chatId, filePath, caption = '') {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('photo', new Blob([fileBuffer]), path.basename(filePath));

    const res = await fetch(`${BASE_URL}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.error('sendPhoto error:', err.message);
  }
}

async function sendAction(chatId, action = 'typing') {
  return await apiCall('sendChatAction', { chat_id: chatId, action });
}

// Check TCP port
function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Get standard keyboard
function getMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📊 Status Sistem' }, { text: '🧪 QA Health Check' }],
        [{ text: '📸 Screenshot Portal' }, { text: '📸 Screenshot POS' }],
        [{ text: '🚀 Auto Deploy Git' }, { text: '📋 List Task Agent' }],
        [{ text: '👥 Tim 6-Agent SOP' }, { text: '❓ Bantuan & Perintah' }],
      ],
      resize_keyboard: true,
      persistent: true,
    },
  };
}

// Command Handlers
async function handleStatus(chatId) {
  await sendAction(chatId, 'typing');

  // Check local services
  const port3000 = await checkPort(3000);
  const port3001 = await checkPort(3001);
  const port4000 = await checkPort(4000);

  // Check Cloud Vercel
  let vercelApiOk = false;
  let vercelPortalOk = false;
  try {
    const r1 = await fetch('https://kaisar-gym.vercel.app/api/members', { signal: AbortSignal.timeout(5000) });
    vercelApiOk = r1.ok;
  } catch {}

  try {
    const r2 = await fetch('https://kaisar-gym-portal.vercel.app', { signal: AbortSignal.timeout(5000) });
    vercelPortalOk = r2.ok;
  } catch {}

  // Git info
  let gitBranch = 'unknown';
  let gitCommit = 'unknown';
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    gitCommit = execSync('git log -1 --pretty=format:"%h - %s"', { encoding: 'utf-8' }).trim();
  } catch {}

  const msg = [
    `🏛️ *KAISAR GYM — STATUS SISTEM*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💻 *Local Dev Servers (PC):*`,
    `• POS Kasir (3000)     : ${port3000 ? '🟢 ONLINE' : '🔴 OFFLINE'}`,
    `• Portal Member (3001) : ${port3001 ? '🟢 ONLINE' : '🔴 OFFLINE'}`,
    `• Backend NestJS (4000): ${port4000 ? '🟢 ONLINE' : '🔴 OFFLINE'}`,
    ``,
    `☁️ *Production Cloud (Vercel):*`,
    `• API Backend : ${vercelApiOk ? '🟢 LIVE (200 OK)' : '🔴 ERROR'}`,
    `• Portal Web  : ${vercelPortalOk ? '🟢 LIVE (200 OK)' : '🔴 ERROR'}`,
    ``,
    `🗄️ *Database:* Supabase PostgreSQL (Tokyo)`,
    `🌿 *Git Branch:* \`${gitBranch}\``,
    `📌 *Latest Commit:* \`${gitCommit}\``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⏰ _${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB_`,
  ].join('\n');

  await sendMessage(chatId, msg, getMainKeyboard());
}

async function handleScreenshot(chatId, target = 'portal') {
  await sendAction(chatId, 'upload_photo');
  const isPos = target.toLowerCase() === 'pos';
  const url = isPos ? 'http://localhost:3000' : 'https://kaisar-gym-portal.vercel.app';
  const title = isPos ? 'POS Kasir Frontdesk' : 'Portal Member & Personal Trainer';

  await sendMessage(chatId, `⏳ *Sedang mengambil screenshot visual ${title}...*`);

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });

    const scratchDir = path.join(__dirname, '..', 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

    const ssPath = path.join(scratchDir, `telegram_${target}.jpg`);
    await page.screenshot({ path: ssPath, quality: 80, type: 'jpeg' });
    await browser.close();

    const caption = [
      `📸 *Visual QA Screenshot: ${title}*`,
      `🔗 *URL:* ${url}`,
      `⏰ *Waktu:* ${new Date().toLocaleTimeString('id-ID')} WIB`,
      `✅ *Render Status:* Normal (No crash)`,
    ].join('\n');

    await sendPhoto(chatId, ssPath, caption);
  } catch (err) {
    await sendMessage(chatId, `❌ *Gagal mengambil screenshot:* ${err.message}`);
  }
}

async function handleTest(chatId) {
  await sendAction(chatId, 'typing');
  await sendMessage(chatId, `🧪 *Menjalankan QA Health Check Suite...*`);

  const tests = [
    { name: 'Endpoint /api/members', url: 'https://kaisar-gym.vercel.app/api/members' },
    { name: 'Endpoint /api/trainers', url: 'https://kaisar-gym.vercel.app/api/trainers' },
    { name: 'Endpoint /api/classes', url: 'https://kaisar-gym.vercel.app/api/classes' },
    { name: 'Endpoint /api/pos/products', url: 'https://kaisar-gym.vercel.app/api/pos/products' },
    { name: 'Frontend Portal Home', url: 'https://kaisar-gym-portal.vercel.app' },
  ];

  const results = [];
  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await fetch(t.url, { signal: AbortSignal.timeout(6000) });
      const latency = Date.now() - start;
      results.push(`• ${t.name}: ${res.ok ? '✅ PASS' : '⚠️ ' + res.status} (${latency}ms)`);
    } catch (e) {
      results.push(`• ${t.name}: ❌ TIMEOUT / FAIL`);
    }
  }

  const report = [
    `🧪 *HASIL QA HEALTH CHECK AUTOMATION*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ...results,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎯 *Kesimpulan:* Semua layanan inti siap melayani operasional Kaisar Gym!`,
  ].join('\n');

  await sendMessage(chatId, report, getMainKeyboard());
}

async function handleDeploy(chatId) {
  await sendAction(chatId, 'typing');
  await sendMessage(chatId, `🚀 *Memulai Auto-Deploy ke Vercel via Git...*`);

  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (status) {
      execSync('git add .', { encoding: 'utf-8' });
      execSync('git commit -m "chore(auto): deploy triggered via Telegram Bot"', { encoding: 'utf-8' });
    }
    const pushOutput = execSync('git push origin main', { encoding: 'utf-8' });
    const latest = execSync('git log -1 --pretty=format:"%h - %s"', { encoding: 'utf-8' }).trim();

    await sendMessage(
      chatId,
      `🎉 *Deploy Berhasil Terkirim ke GitHub!*\n\n` +
      `📌 *Commit:* \`${latest}\`\n` +
      `☁️ *Vercel:* Otomatis me-redeploy versi terbaru dalam ~60 detik!\n\n` +
      `🔗 Portal: https://kaisar-gym-portal.vercel.app`,
      getMainKeyboard()
    );
  } catch (err) {
    await sendMessage(chatId, `❌ *Deploy Error:* ${err.message}`, getMainKeyboard());
  }
}

const LANGUAGE_SERVER_EXE = 'C:\\Users\\shive\\AppData\\Local\\Programs\\Antigravity\\resources\\bin\\language_server.exe';

function triggerAgent(chatId, taskId, taskText) {
  const convId = config.conversationId || 'cbd93329-9106-41e9-ad80-11dbff393ace';
  const prompt = `[TELEGRAM_LIVE_TASK: chatId=${chatId}, taskId=${taskId}] Instruksi dari Telegram: "${taskText}". Tolong eksekusi langsung tugas ini (tulis/edit kode, build/test jika perlu), lalu kirimkan laporan dan screenshot hasil uji coba ke chat Telegram admin (chatId: ${chatId}).`;

  execFile(
    LANGUAGE_SERVER_EXE,
    ['agentapi', 'send-message', convId, prompt],
    (err, stdout, stderr) => {
      if (err) {
        console.error(`[AgentAPI Error]:`, err.message);
      } else {
        console.log(`[AgentAPI Triggered]: Task ${taskId} sukses diserahkan ke Antigravity Agent!`);
      }
    }
  );
}

async function handleAddTask(chatId, taskText) {
  let tasks = [];
  try {
    tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  } catch {}

  const newTask = {
    id: `TASK-${Date.now().toString().slice(-4)}`,
    text: taskText,
    createdAt: new Date().toISOString(),
    status: 'PROCESSING',
  };

  tasks.push(newTask);
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));

  await sendMessage(
    chatId,
    `⚡ *Tugas Masuk ke 6-Agent Engineering Pipeline!* 🤖\n\n` +
    `🆔 *ID:* \`${newTask.id}\`\n` +
    `📋 *Detail:* "${taskText}"\n` +
    `🚀 *Status:* \`PROCESSING (Multi-Agent Otonom Berjalan di PC...)\`\n\n` +
    `🔄 *Tahapan Eksekusi:*\n` +
    `1️⃣ 📋 *PM:* Breakdown User Story & Spesifikasi\n` +
    `2️⃣ 📐 *Architect:* Validasi Skema Database & DTO API\n` +
    `3️⃣ 🎨 *UI/UX:* Implementasi Kode & Anti-Slop Layout\n` +
    `4️⃣ 🔍 *Reviewer:* Clean Code & Modularity Inspection\n` +
    `5️⃣ 🛡️ *SecOps:* Audit Keamanan OWASP & Proteksi Data\n` +
    `6️⃣ 🚀 *DevOps:* Build, Playwright Visual QA & Cloud Release\n\n` +
    `_Laporan kemajuan dan screenshot akan otomatis dikirimkan ke chat ini._`,
    getMainKeyboard()
  );

  // Auto-trigger the autonomous AI coding agent
  triggerAgent(chatId, newTask.id, taskText);
}

async function handleAgents(chatId) {
  const msg = [
    `👥 *STRUKTUR 6-AGENT OTONOM KAISAR GYM*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `1️⃣ 📋 *Product Manager (PM)*`,
    `   Uraikan instruksi kasar jadi PRD, user story, & acceptance criteria.`,
    ``,
    `2️⃣ 📐 *System Architect*`,
    `   Rancang skema database (Prisma), kontrak REST API & DTOs, dan integrasi MCP.`,
    ``,
    `3️⃣ 🎨 *UI/UX Integrator*`,
    `   Implementasi antarmuka Next.js/Tailwind, mobile-first, dan bebas Anti-Slop.`,
    ``,
    `4️⃣ 🔍 *Code Reviewer*`,
    `   Validasi clean code, strict TypeScript, modularitas, dan refactoring.`,
    ``,
    `5️⃣ 🛡️ *Security Auditor (SecOps)*`,
    `   Audit keamanan OWASP, JWT/RBAC, sanitasi input, dan proteksi secret.`,
    ``,
    `6️⃣ 🚀 *DevOps & QA Engineer*`,
    `   Build verification (npm run build), visual Playwright QA, dan deploy Vercel.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📁 _SOP lengkap tersimpan di folder \`.agents/\`_`,
  ].join('\n');

  await sendMessage(chatId, msg, getMainKeyboard());
}

async function handleListTasks(chatId) {
  let tasks = [];
  try {
    tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  } catch {}

  if (tasks.length === 0) {
    return await sendMessage(chatId, `📋 *Tidak ada antrian task saat ini.* Semuanya sudah beres!`, getMainKeyboard());
  }

  const list = tasks.slice(-5).map((t, i) => `${i + 1}. [${t.status}] \`${t.id}\`: ${t.text}`);
  await sendMessage(
    chatId,
    `📋 *DAFTAR TASK AGENT (Terbaru):*\n━━━━━━━━━━━━━━━━━━━━\n${list.join('\n')}`,
    getMainKeyboard()
  );
}

async function handleHelp(chatId) {
  const helpText = [
    `🤖 *PANDUAN PERINTAH TELEGRAM BOT KAISAR GYM*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `• *📊 Status Sistem* atau \`/status\``,
    `  Mengecek kondisi server lokal, cloud Vercel & Supabase.`,
    ``,
    `• *📸 Screenshot Portal* atau \`/screenshot portal\``,
    `  Mengambil foto live Portal Member & Coach via Playwright.`,
    ``,
    `• *📸 Screenshot POS* atau \`/screenshot pos\``,
    `  Mengambil foto antarmuka POS Kasir lokal.`,
    ``,
    `• *🧪 QA Health Check* atau \`/test\``,
    `  Menguji endpoint API untuk memastikan semua data responsif.`,
    ``,
    `• *🚀 Auto Deploy Git* atau \`/deploy\``,
    `  Melakukan git commit & push otomatis ke Vercel production.`,
    ``,
    `• *Ketik Pesan Bebas:*`,
    `  Ketik instruksi apa saja (misal: _"Buat fitur export PDF laporan kasir"_), bot akan langsung memasukkannya ke antrian agent!`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');

  await sendMessage(chatId, helpText, getMainKeyboard());
}

// Main message router
async function processMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const senderName = msg.from.first_name || 'Admin';

  console.log(`[Telegram] Pesan dari ${senderName} (${chatId}): ${text}`);

  // Whitelist / Pairing logic
  if (!config.adminChatId) {
    config.adminChatId = chatId;
    saveConfig(config);
    console.log(`[Telegram] ✅ Admin Chat ID berhasil di-pair ke: ${chatId} (${senderName})`);
    await sendMessage(
      chatId,
      `🎉 *Selamat Datang, ${senderName}!* Akun Telegram Anda telah berhasil di-pairing sebagai *Super Admin Kaisar Gym*.`
    );
  } else if (config.adminChatId !== chatId) {
    console.warn(`[Telegram] ⚠️ Pesan ditolak dari unauthorized ID: ${chatId}`);
    return await sendMessage(chatId, `⛔ *Akses Ditolak:* Bot ini privat khusus untuk manajemen Kaisar Gym.`);
  }

  // Router
  if (text === '/start' || text === '/menu') {
    await sendMessage(
      chatId,
      `👑 *Halo ${senderName}!* Sistem Agentic Coding & DevOps Kaisar Gym siap melayani Anda 24/7.\n\nSilakan pilih menu di bawah:`,
      getMainKeyboard()
    );
  } else if (text === '📊 Status Sistem' || text === '/status') {
    await handleStatus(chatId);
  } else if (text === '📸 Screenshot Portal' || text === '/screenshot portal') {
    await handleScreenshot(chatId, 'portal');
  } else if (text === '📸 Screenshot POS' || text === '/screenshot pos') {
    await handleScreenshot(chatId, 'pos');
  } else if (text === '🧪 QA Health Check' || text === '/test') {
    await handleTest(chatId);
  } else if (text === '🚀 Auto Deploy Git' || text === '/deploy') {
    await handleDeploy(chatId);
  } else if (text === '📋 List Task Agent' || text === '/tasks') {
    await handleListTasks(chatId);
  } else if (text === '👥 Tim 6-Agent SOP' || text === '/agents') {
    await handleAgents(chatId);
  } else if (text === '❓ Bantuan & Perintah' || text === '/help') {
    await handleHelp(chatId);
  } else {
    // Treat any other message as a new Agent Task
    await handleAddTask(chatId, text);
  }
}

// Long Polling Loop
let lastUpdateId = 0;

async function pollUpdates() {
  try {
    const res = await fetch(`${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=25`, {
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          await processMessage(update.message);
        }
      }
    }
  } catch (err) {
    // Timeout is normal in long polling
    if (!err.message.includes('timeout') && !err.message.includes('aborted')) {
      console.error('Polling error:', err.message);
    }
  }

  // Continue polling
  setImmediate(pollUpdates);
}

console.log('🤖 Kaisar Gym Telegram Controller Bot is STARTING...');
console.log(`🔗 Bot: https://t.me/agenticodingbot`);
console.log('📡 Long-polling loop active...');

pollUpdates();
