import { NextRequest, NextResponse } from 'next/server';

// Edge runtime avoids Node.js function cold-start overhead: measured
// 883-1700ms for this route under the nodejs runtime even on the
// zero-external-call validation-rejection path, before it ever reaches
// the Resend fetch. The route only uses fetch/JSON/RegExp - no Node API -
// so it is fully edge-compatible. Confirmed safe: a separate production
// hydration issue (React #418/#423/#329) that appeared alongside this
// change was root-caused to Netlify's platform-level "hosting-provider"
// HTML injection into <head> on every SSR response - present identically
// whether this route runs on edge or nodejs, and unrelated to it.
export const runtime = 'edge';

const RECIPIENT_EMAIL = 'sarthakroy40@gmail.com';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  if (name.length > 200 || email.length > 200 || subject.length > 300 || message.length > 5000) {
    return NextResponse.json({ error: 'One or more fields exceed the allowed length.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      'Contact form: RESEND_API_KEY environment variable is not set. ' +
        'Set it locally in .env.local and in the production host\'s environment variables to enable email delivery.'
    );
    return NextResponse.json(
      { error: 'Email service is not configured. Please reach out directly via email instead.' },
      { status: 500 }
    );
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [RECIPIENT_EMAIL],
        reply_to: email,
        subject: subject || `Portfolio inquiry from ${name}`,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
        `,
      }),
      signal: controller.signal,
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error(`Contact form: Resend API responded with ${resendResponse.status}: ${errorBody}`);
      return NextResponse.json(
        { error: 'Failed to send your message. Please try again or email directly.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.error(
      isTimeout
        ? 'Contact form: Resend request timed out after 8s.'
        : 'Contact form: unexpected error while sending email.',
      isTimeout ? undefined : error
    );
    return NextResponse.json(
      { error: 'Failed to send your message. Please try again or email directly.' },
      { status: isTimeout ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
