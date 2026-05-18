import crypto from "crypto";

/**
 * Verify Svix webhook signature
 * Svix uses HMAC-SHA256 for webhook signature verification
 * 
 * @param payload - The raw request body as a string
 * @param signature - The Svix-Signature header value
 * @param secret - The webhook secret (optional, for additional security)
 * @returns true if signature is valid, false otherwise
 */
export function verifySvixSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  if (!signature) {
    return false;
  }

  // Svix signature format: "t=1234567890,v1=abc123..."
  const parts = signature.split(",");
  const signatureParts: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      signatureParts[key] = value;
    }
  }

  const timestamp = signatureParts["t"];
  const v1Signature = signatureParts["v1"];

  if (!timestamp || !v1Signature) {
    return false;
  }

  // Check timestamp is within 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000);
  const timestampNum = parseInt(timestamp, 10);
  
  if (Math.abs(now - timestampNum) > 300) {
    return false;
  }

  // If secret is provided, use it for HMAC verification
  if (secret) {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(v1Signature),
      Buffer.from(expectedSignature)
    );
  }

  // Without secret, we can only verify the timestamp
  // In production, you should always use a secret
  return true;
}

/**
 * Extract the signature from the Svix-Signature header
 * 
 * @param header - The Svix-Signature header value
 * @returns The signature object with timestamp and signature values
 */
export function parseSvixSignature(header: string): {
  timestamp: string;
  signature: string;
} | null {
  if (!header) {
    return null;
  }

  const parts = header.split(",");
  const result: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      result[key] = value;
    }
  }

  const timestamp = result["t"];
  const signature = result["v1"];

  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

/**
 * Middleware function to verify webhook signatures in Next.js API routes
 * 
 * @param request - The Next.js request object
 * @param secret - The webhook secret
 * @returns true if signature is valid, false otherwise
 */
export async function verifyWebhookMiddleware(
  request: Request,
  secret?: string
): Promise<boolean> {
  const signature = request.headers.get("svix-signature") || 
                   request.headers.get("webhook-signature");

  if (!signature) {
    return false;
  }

  const payload = await request.text();
  return verifySvixSignature(payload, signature, secret);
}
