export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Telegram credentials not configured' });
  }

  const event = req.query.event || 'visit';
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'Unknown';

  const ua = req.headers['user-agent'] || 'Unknown';
  const ref = req.headers['referer'] || 'Direct';
  const now = new Date().toLocaleString('en-GB', { timeZone: 'UTC', hour12: false });

  const emoji = event === 'download' ? '📥' : '👁️';
  const label = event === 'download' ? 'INSTALLER DOWNLOADED' : 'NEW VISITOR';

  const message =
    `${emoji} *KittyCraft — ${label}*\n` +
    `\`\`\`\n` +
    `IP       : ${ip}\n` +
    `Event    : ${event}\n` +
    `Time     : ${now} UTC\n` +
    `Referrer : ${ref}\n` +
    `Agent    : ${ua.slice(0, 80)}\n` +
    `\`\`\``;

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );
    const data = await tgRes.json();
    if (!data.ok) return res.status(500).json({ error: data.description });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
