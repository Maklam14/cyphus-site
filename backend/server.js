import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Cyphus - Formulário" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "Nova mensagem recebida",
      html: `
        <h2>Nova mensagem do site</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Mensagem:</strong><br>${message}</p>
      `
    });

    res.json({ success: true, message: "E-mail enviado com sucesso" });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    res.status(500).json({ success: false, message: "Erro ao enviar e-mail" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Servidor rodando na porta ${process.env.PORT}`)
);