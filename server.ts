import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "MY_RESEND_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email API Route
  app.post("/api/send-parent-email", async (req, res) => {
    try {
      const { studentName, parentEmail, type, time } = req.body;

      if (!parentEmail || !parentEmail.includes('@')) {
        return res.status(400).json({ error: "Email phụ huynh không hợp lệ" });
      }

      const resend = getResendClient();
      
      if (!resend) {
        console.warn("[Notification System] Skipping email send: RESEND_API_KEY is not configured.");
        // We return success: false with a clear reason so the UI can decide how to show it
        return res.status(202).json({ 
          success: false, 
          status: 'simulated',
          message: "Hệ thống email chưa được cấu hình. Thông báo đã được ghi nhận vào hệ thống nội bộ." 
        });
      }

      const subject = type === 'late' 
        ? `[Thông báo] Học sinh ${studentName} đến trường MUỘN` 
        : `[Thông báo] Học sinh ${studentName} đã đến trường`;

      const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
          <h2 style="color: ${type === 'late' ? '#e11d48' : '#10b981'};">Thông báo điểm danh</h2>
          <p>Kính gửi phụ huynh em <strong>${studentName}</strong>,</p>
          <p>Nhà trường xin thông báo em đã thực hiện điểm danh tại cổng trường:</p>
          <ul>
            <li><strong>Thời gian:</strong> ${time}</li>
            <li><strong>Trạng thái:</strong> <span style="color: ${type === 'late' ? '#e11d48' : '#10b981'}; font-weight: bold;">${type === 'late' ? 'Vào Muộn' : 'Đúng Giờ'}</span></li>
          </ul>
          <p>Trân trọng,<br/>Hệ thống Quản lý Học đường AI</p>
        </div>
      `;

      const result = await resend!.emails.send({
        from: "School Portal <onboarding@resend.dev>",
        to: parentEmail,
        subject: subject,
        html: html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      res.json({ success: true, id: result.data?.id });
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
