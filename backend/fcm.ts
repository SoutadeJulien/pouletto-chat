export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: params.token,
      title: params.title,
      body: params.body,
      data: params.data,
      priority: 'high',
    }),
  });
  if (!res.ok) {
    throw new Error(`Expo push failed: ${await res.text()}`);
  }
}
