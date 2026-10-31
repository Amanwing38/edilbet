async function check() {
  const token = '9032798707:AAFHG03bFuzmievRJLCBEfq7nNJ_5dkWwfE';
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  console.log('Webhook Info:', data);

  const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=5`);
  const updatesData = await updatesRes.json();
  console.log('Pending Updates:', updatesData);
}
check();
