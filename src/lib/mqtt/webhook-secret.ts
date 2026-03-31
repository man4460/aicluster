export function verifyMqttWebhookSecret(headers: Headers): boolean {
  const secret = process.env.MQTT_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const got = headers.get("x-mqtt-secret")?.trim() ?? "";
  return got.length > 0 && got === secret;
}
