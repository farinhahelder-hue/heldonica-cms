/**
 * API route — Confirm Travel Request
 * When status changes to in_progress (confirmed), sends confirmation email via Resend
 */
import { NextRequest, NextResponse } from "next/server";

// Note: Resend would be configured with RESEND_API_KEY env var
// import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Note: In production, would call DB:
    // await updateTravelRequestStatus(id, "in_progress");

    // Note: In production, would send email via Resend:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Heldonica <contact@heldonica.fr>",
      to: travelerEmail,
      subject: "Votre voyage sur mesure Heldonica est confirmé ✈️",
      html: `
        <h1>Bonjour ${travelerName},</h1>
        <p>Votre voyage vers ${destination} est confirmé !</p>
        <p>Dates: ${departureDate} - ${returnDate}</p>
        <p><a href="https://heldonica.fr/rdv">Prendre rendez-vous</a></p>
      `,
    });
    */

    return NextResponse.json({ success: true, message: "Request confirmed, email would be sent" });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}