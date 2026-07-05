import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const BULKSMSBD_URL = "http://bulksmsbd.net/api/smsapi";

function parseBulkSmsSuccess(body: string, status: number): boolean {
  if (status === 202) return true;
  try {
    const json = JSON.parse(body) as { response_code?: number | string; success?: boolean };
    const code = Number(json.response_code);
    if (code === 202 || json.success === true) return true;
  } catch {
    // plain text / html response
  }
  return /\b202\b/.test(body);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  const apiKey = Deno.env.get("BULKSMSBD_API_KEY");
  const senderId = Deno.env.get("BULKSMSBD_SENDER_ID");

  if (!hookSecret) {
    console.error("Missing SEND_SMS_HOOK_SECRET");
    return new Response(JSON.stringify({ error: "Missing SEND_SMS_HOOK_SECRET" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!apiKey || !senderId) {
    console.error("Missing BulkSMSBD credentials");
    return new Response(JSON.stringify({ error: "Missing BulkSMSBD credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret.replace(/^v1,whsec_/, ""));

  let data: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    data = wh.verify(payload, headers) as typeof data;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const phone = data.user?.phone;
  const otp = data.sms?.otp;

  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: "Missing phone or OTP" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("880")) {
    number = number.startsWith("0") ? `88${number}` : `880${number}`;
  }

  const message = `আরোপন OTP হলো ${otp}`;
  const params = new URLSearchParams({
    api_key: apiKey,
    type: "text",
    number,
    senderid: senderId,
    message,
  });

  try {
    const smsRes = await fetch(`${BULKSMSBD_URL}?json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const body = await smsRes.text();
    console.log("BulkSMSBD", { number, status: smsRes.status, body });

    if (parseBulkSmsSuccess(body, smsRes.status)) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "SMS send failed", detail: body }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("BulkSMSBD error:", err);
    return new Response(JSON.stringify({ error: "SMS provider error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
