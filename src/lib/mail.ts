const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.log("\n==================================================");
    console.log(`✉️  [EMAIL FALLBACK] Sent email to: ${to}`);
    console.log(`📂  Subject: ${subject}`);
    console.log("--------------------------------------------------");
    console.log(html.replace(/<[^>]*>/g, " ").trim().substring(0, 500) + "...");
    console.log("==================================================\n");
    return { success: true, fallback: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Email Error] Resend API error:", errorText);
      return { success: false, error: errorText };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("[Email Error] Failed to send email via Resend:", err);
    return { success: false, error: err };
  }
}

/**
 * Sends a verification email containing a 6-digit code.
 */
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${APP_URL}/verify-email?email=${encodeURIComponent(email)}&token=${token}`;
  
  const html = `
    <div style="background-color: #09090b; color: #e4e4e7; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
        PQ <span style="color: #f97316;">FIGHTERS</span>
      </h1>
      <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 30px;">Centro de Treinamento</p>
      
      <div style="background-color: #18181b; padding: 30px; border-radius: 6px; border: 1px solid #27272a; margin-bottom: 30px;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Olá, ${name}!</h2>
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
          Obrigado por se cadastrar na PQ Fighters. Para ativar o seu cadastro e prosseguir para a aprovação, confirme o seu endereço de e-mail utilizando o código abaixo:
        </p>
        
        <div style="font-size: 36px; font-weight: bold; color: #f97316; letter-spacing: 6px; margin: 25px 0; background-color: #09090b; padding: 15px; border-radius: 4px; border: 1px dashed #f97316; display: inline-block;">
          ${token}
        </div>
        
        <p style="color: #d4d4d8; font-size: 14px; margin-top: 25px; margin-bottom: 10px;">
          Ou clique no botão abaixo para verificar sua conta diretamente:
        </p>
        
        <a href="${verifyLink}" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 10px; transition: background-color 0.2s;">
          Confirmar E-mail
        </a>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 20px;">
        Se você não solicitou este cadastro, por favor ignore este e-mail.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "PQ Fighters - Verifique seu e-mail",
    html,
  });
}

/**
 * Sends a password reset email with a link containing the unique token.
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="background-color: #09090b; color: #e4e4e7; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
        PQ <span style="color: #f97316;">FIGHTERS</span>
      </h1>
      <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 30px;">Centro de Treinamento</p>
      
      <div style="background-color: #18181b; padding: 30px; border-radius: 6px; border: 1px solid #27272a; margin-bottom: 30px;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Redefinição de Senha</h2>
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
          Olá, ${name}. Recebemos uma solicitação para redefinir a senha da sua conta na PQ Fighters. Clique no botão abaixo para prosseguir com a redefinição:
        </p>
        
        <a href="${resetLink}" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 25px; transition: background-color 0.2s;">
          Redefinir Senha
        </a>
        
        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5;">
          Este link expira em 1 hora. Se você não solicitou a redefinição de senha, nenhuma ação adicional é necessária.
        </p>
      </div>
      
      <p style="color: #71717a; font-size: 12px; margin-top: 20px;">
        Se estiver com problemas para clicar no botão, copie e cole o link abaixo no seu navegador:<br/>
        <span style="color: #f97316; word-break: break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "PQ Fighters - Redefinição de Senha",
    html,
  });
}
