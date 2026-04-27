interface ExhaustedAttemptsEmailInput {
  to: string;
  studentName?: string | null;
  courseTitle: string;
  moduleTitle: string;
}

export async function sendExhaustedAttemptsEmail({
  to,
  studentName,
  courseTitle,
  moduleTitle,
}: ExhaustedAttemptsEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("[EVALUATION_RETRY_EMAIL] Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
    return { sent: false as const, reason: "missing_config" as const };
  }

  const safeName = studentName?.trim() ? studentName : "estudiante";
  const subject = "Agotaste tus intentos de evaluación";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p>Hola ${safeName},</p>
      <p>
        Identificamos que agotaste tus intentos en la evaluación del módulo <strong>${moduleTitle}</strong>
        del curso <strong>${courseTitle}</strong>.
      </p>
      <p>
        Para habilitar nuevos intentos, debes acercarte al aula STEAM y solicitar el código de reintento.
      </p>
      <p>
        Si tienes dudas, puedes comunicarte al correo <a href="mailto:aula_steam_med@unal.edu.co">aula_steam_med@unal.edu.co</a>.
      </p>
      <p>Equipo Aula STEAM</p>
    </div>
  `;

  const text = [
    `Hola ${safeName},`,
    `Agotaste tus intentos en la evaluación del módulo "${moduleTitle}" del curso "${courseTitle}".`,
    "Para habilitar nuevos intentos, acércate al aula STEAM y solicita el código de reintento.",
    "Contacto: aula_steam_med@unal.edu.co",
  ].join("\n\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[EVALUATION_RETRY_EMAIL] Resend error:", body);
    return { sent: false as const, reason: "provider_error" as const };
  }

  return { sent: true as const };
}

