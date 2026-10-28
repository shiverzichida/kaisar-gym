/**
 * Kaisar Gym - 6-Agent Autonomous Engineering Pipeline Runner
 * Connects Product Manager, Architect, UI/UX Integrator, Code Reviewer, SecOps, and DevOps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const BOT_TOKEN = '9009168995:AAF56wmPtt0O4mCip1mQ37PXvqJG-EMiOzA';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TASKS_FILE = path.join(__dirname, 'agent_tasks.json');
const CONFIG_FILE = path.join(__dirname, 'telegram_config.json');

// Telegram messaging helpers
async function sendTelegram(chatId, message) {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('[Pipeline] Telegram send error:', err.message);
  }
}

async function sendTelegramPhoto(chatId, filePath, caption = '') {
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
    console.error('[Pipeline] Telegram photo error:', err.message);
  }
}

// Gate Notification Helpers
const GATES = {
  1: { name: 'Product Manager (PRD & Requirements)', emoji: '📋' },
  2: { name: 'System Architect (Schema & API Design)', emoji: '📐' },
  3: { name: 'UI/UX Integrator & Developer (Code & Styling)', emoji: '🎨' },
  4: { name: 'Code Reviewer (Clean Code & Refactor)', emoji: '🔍' },
  5: { name: 'Security Auditor (SecOps & OWASP Scan)', emoji: '🛡️' },
  6: { name: 'DevOps & QA Engineer (Build, Test & Release)', emoji: '🚀' },
};

async function notifyGate(chatId, gateNumber, status, details = '') {
  const gate = GATES[gateNumber] || { name: `Gate ${gateNumber}`, emoji: '⚙️' };
  const statusEmoji = status === 'START' ? '⏳' : status === 'PASS' ? '✅' : '❌';
  
  const msg = [
    `${gate.emoji} *GATE ${gateNumber}: ${gate.name}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Status: ${statusEmoji} \`${status}\``,
    details ? `\n${details}` : '',
  ].filter(Boolean).join('\n');

  console.log(`[Pipeline Gate ${gateNumber}] ${status}: ${details}`);
  if (chatId) {
    await sendTelegram(chatId, msg);
  }
}

// Visual QA Capture Helper
async function captureVisualQA(targetUrl, outputPath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });
  await page.screenshot({ path: outputPath, quality: 80, type: 'jpeg' });
  await browser.close();
  return outputPath;
}

// Task state management
function updateTaskState(taskId, newStatus, extra = {}) {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      const idx = tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], status: newStatus, ...extra, updatedAt: new Date().toISOString() };
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
      }
    }
  } catch (err) {
    console.error('[Pipeline] updateTaskState error:', err.message);
  }
}

// CLI handler for direct execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'notify') {
    const chatId = args[1];
    const gateNum = parseInt(args[2], 10);
    const status = args[3];
    const details = args.slice(4).join(' ');
    await notifyGate(chatId, gateNum, status, details);
  } else if (command === 'qa-screenshot') {
    const chatId = args[1];
    const url = args[2] || 'https://kaisar-gym-portal.vercel.app';
    const caption = args.slice(3).join(' ') || 'Visual QA Screenshot';
    const scratchDir = path.join(__dirname, '..', 'scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
    const ssPath = path.join(scratchDir, `qa_pipeline_${Date.now()}.jpg`);
    await captureVisualQA(url, ssPath);
    if (chatId) {
      await sendTelegramPhoto(chatId, ssPath, caption);
    }
    console.log(`[Pipeline] Screenshot saved to ${ssPath}`);
  } else if (command === 'complete-task') {
    const taskId = args[1];
    const summary = args.slice(2).join(' ');
    updateTaskState(taskId, 'COMPLETED', { completedAt: new Date().toISOString(), summary });
    console.log(`[Pipeline] Task ${taskId} marked as COMPLETED.`);
  } else {
    console.log(`Kaisar Gym 6-Agent Pipeline CLI`);
    console.log(`Usage:`);
    console.log(`  node scripts/agent_pipeline.js notify <chatId> <gateNumber> <START|PASS|FAIL> <details>`);
    console.log(`  node scripts/agent_pipeline.js qa-screenshot <chatId> <url> <caption>`);
    console.log(`  node scripts/agent_pipeline.js complete-task <taskId> <summary>`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  notifyGate,
  captureVisualQA,
  updateTaskState,
  sendTelegram,
  sendTelegramPhoto,
  GATES,
};
