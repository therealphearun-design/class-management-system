const express = require('express');
const multer = require('multer');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.get('/chat-id-candidates', async (_req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({
        success: false,
        message: 'Missing TELEGRAM_BOT_TOKEN',
      });
    }

    const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      return res.status(502).json({
        success: false,
        message: 'Telegram API getUpdates failed',
        telegram: payload,
      });
    }

    const seen = new Set();
    const chats = (payload.result || [])
      .map((update) => update?.message?.chat || update?.channel_post?.chat)
      .filter(Boolean)
      .filter((chat) => {
        const key = `${chat.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((chat) => ({
        id: chat.id,
        title: chat.title || chat.username || chat.first_name || 'Unknown',
        type: chat.type,
      }));

    return res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load chat IDs',
    });
  }
});

router.post('/attendance/telegram-report', upload.single('file'), async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        success: false,
        message: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing file upload field "file".',
      });
    }

    const caption = String(req.body?.caption || 'Attendance report').slice(0, 1024);
    const fileName = req.file.originalname || 'attendance-report.xls';

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append(
      'document',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }),
      fileName
    );
    formData.append('caption', caption);

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await telegramResponse.json();
    if (!telegramResponse.ok || !result?.ok) {
      return res.status(502).json({
        success: false,
        message: 'Telegram API rejected document',
        telegram: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance report sent to Telegram',
      telegramMessageId: result?.result?.message_id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to send telegram report',
    });
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large.' : error.message,
    });
  }
  return next(error);
});

module.exports = router;
