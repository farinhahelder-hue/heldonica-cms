/**
 * emailService.ts — Resend pour Heldonica CMS
 * Utilisé par la route travelPlanning.create pour envoyer :
 *   1. Un email de notification interne à contact@heldonica.fr
 *   2. Un email de confirmation au voyageur
 */
import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY non configurée — emails désactivés");
    return null;
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Heldonica CMS <cms@heldonica.fr>";
const NOTIFY_EMAIL = process.env.EMAIL_NOTIFY ?? "contact@heldonica.fr";

interface TravelRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  duration?: string | null;
  travelers?: string | null;
  travelType?: string | null;
  budget?: string | null;
  message?: string | null;
  howDidYouFind?: string | null;
}

export async function sendTravelRequestEmails(data: TravelRequestPayload): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const fullName = `${data.firstName} ${data.lastName}`;
  const receivedAt = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  // ── Email interne ─────────────────────────────────────────────────────────
  const internalHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Nouvelle demande Travel Planning</title></head>
<body style="font-family:Georgia,serif;background:#f7f6f2;margin:0;padding:24px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0ddd8">
    <div style="background:#01696f;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600">✈️ Nouvelle demande Travel Planning</h1>
      <p style="color:#cedcd8;margin:4px 0 0;font-size:13px">Reçue le ${receivedAt}</p>
    </div>
    <div style="padding:28px 32px;space-y:16px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #f0ede8">
          <td style="padding:10px 0;color:#7a7974;width:40%">Nom</td>
          <td style="padding:10px 0;font-weight:600;color:#28251d">${fullName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0ede8">
          <td style="padding:10px 0;color:#7a7974">Email</td>
          <td style="padding:10px 0"><a href="mailto:${data.email}" style="color:#01696f">${data.email}</a></td>
        </tr>
        ${data.phone ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Téléphone</td><td style="padding:10px 0;color:#28251d">${data.phone}</td></tr>` : ""}
        ${data.destination ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Destination</td><td style="padding:10px 0;color:#28251d">${data.destination}</td></tr>` : ""}
        ${data.departureDate ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Départ</td><td style="padding:10px 0;color:#28251d">${data.departureDate}</td></tr>` : ""}
        ${data.returnDate ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Retour</td><td style="padding:10px 0;color:#28251d">${data.returnDate}</td></tr>` : ""}
        ${data.duration ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Durée</td><td style="padding:10px 0;color:#28251d">${data.duration}</td></tr>` : ""}
        ${data.travelers ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Voyageurs</td><td style="padding:10px 0;color:#28251d">${data.travelers}</td></tr>` : ""}
        ${data.travelType ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Type de voyage</td><td style="padding:10px 0;color:#28251d">${data.travelType}</td></tr>` : ""}
        ${data.budget ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Budget</td><td style="padding:10px 0;color:#28251d">${data.budget}</td></tr>` : ""}
        ${data.howDidYouFind ? `<tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#7a7974">Via</td><td style="padding:10px 0;color:#28251d">${data.howDidYouFind}</td></tr>` : ""}
      </table>
      ${data.message ? `
      <div style="margin-top:20px;padding:16px;background:#f7f6f2;border-radius:8px;border-left:3px solid #01696f">
        <p style="margin:0 0 8px;font-size:12px;color:#7a7974;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Message</p>
        <p style="margin:0;font-size:14px;color:#28251d;line-height:1.6">${data.message.replace(/\n/g, "<br>")}</p>
      </div>` : ""}
      <div style="margin-top:24px;text-align:center">
        <a href="mailto:${data.email}?subject=Re: Ta demande Travel Planning — Heldonica" style="display:inline-block;background:#01696f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Répondre à ${data.firstName}</a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f7f6f2;border-top:1px solid #e0ddd8;text-align:center">
      <p style="margin:0;font-size:12px;color:#7a7974">Heldonica CMS — notification automatique</p>
    </div>
  </div>
</body>
</html>`;

  // ── Email de confirmation voyageur ────────────────────────────────────────
  const confirmationHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Ta demande Travel Planning est bien reçue !</title></head>
<body style="font-family:Georgia,serif;background:#f7f6f2;margin:0;padding:24px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0ddd8">
    <div style="background:#01696f;padding:32px;text-align:center">
      <p style="font-size:40px;margin:0">✈️</p>
      <h1 style="color:#fff;margin:12px 0 4px;font-size:22px">Ta demande est bien reçue, ${data.firstName} !</h1>
      <p style="color:#cedcd8;margin:0;font-size:14px">On revient vers toi très vite — promis 🌿</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;color:#28251d;line-height:1.7;margin:0 0 20px">
        Merci d'avoir fait confiance à <strong>Heldonica</strong> pour concevoir ton prochain voyage sur mesure.
        On a bien reçu ta demande et on l'étudie avec attention.
      </p>
      ${data.destination ? `
      <div style="padding:16px;background:#f7f6f2;border-radius:8px;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:12px;color:#7a7974;font-weight:600;text-transform:uppercase">Ta destination</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#01696f">${data.destination}</p>
      </div>` : ""}
      <p style="font-size:14px;color:#7a7974;line-height:1.6;margin:0 0 24px">
        En attendant notre retour, n'hésite pas à parcourir <a href="https://heldonica.fr/blog" style="color:#01696f">le blog</a> pour découvrir nos pépites dénichées aux quatre coins du monde.
      </p>
      <div style="text-align:center;margin-top:24px">
        <a href="https://heldonica.fr" style="display:inline-block;background:#01696f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Explorer le blog Heldonica</a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f7f6f2;border-top:1px solid #e0ddd8;text-align:center">
      <p style="margin:0;font-size:12px;color:#7a7974">Heldonica — Slow Travel en couple · <a href="https://heldonica.fr" style="color:#01696f">heldonica.fr</a></p>
    </div>
  </div>
</body>
</html>`;

  await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      replyTo: data.email,
      subject: `✈️ Nouvelle demande Travel Planning — ${fullName} (${data.destination ?? "Destination à préciser"})`,
      html: internalHtml,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Heldonica — Ta demande Travel Planning est bien reçue ✈️`,
      html: confirmationHtml,
    }),
  ]);
}
