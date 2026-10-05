import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandlers } from '../lib/contact.mjs';

const now = 1800000000000;
const env = { RECAPTCHA_SITE_KEY: 'public-test', RECAPTCHA_SECRET_KEY: 'private-test', RECAPTCHA_ALLOWED_HOSTS: 'linkersit.com', RESEND_API_KEY: 're_test', CONTACT_FROM_EMAIL: 'contact@linkersit.com' };
function setup(options = {}) {
  const messages = [], verifications = [];
  const handlers = createContactHandlers(env, { now: () => now, limiter: async () => true,
    fetchImpl: async (...args) => { verifications.push(args); return Response.json({ success: true, hostname: 'linkersit.com', challenge_ts: new Date(now).toISOString() }); },
    sendEmail: async (...args) => { messages.push(args); return { data: { id: 'email-id' }, error: null }; }, ...options,
  });
  async function submit(patch = {}, headers = {}) {
    const config = await handlers.GET(new Request('https://linkersit.com/api/contact'));
    const { csrf } = await config.json();
    const body = { csrf, firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.com', phone: '', service: 'Technology consulting', message: 'Please discuss our new project.', captcha: 'valid-token', website: '', submissionId: '11111111-1111-4111-8111-111111111111', ...patch };
    return handlers.POST(new Request('https://linkersit.com/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: config.headers.get('set-cookie').split(';')[0], Origin: 'https://linkersit.com', ...headers }, body: JSON.stringify(body) }));
  }
  return { handlers, messages, verifications, submit };
}
test('configuration returns only public values and sets protected cookie', async () => {
  const { handlers } = setup(); const response = await handlers.GET(new Request('https://linkersit.com/api/contact'));
  const text = await response.text(); assert.equal(response.status, 200); assert.ok(!text.includes('private-test')); assert.ok(!text.includes('re_test'));
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=1800']) assert.ok(response.headers.get('set-cookie').includes(attribute));
});
test('valid enquiry sends only to company inbox with visitor as Reply-To', async () => {
  const { submit, messages } = setup(); assert.equal((await submit({ to: 'attacker@example.com', from: 'attacker@example.com' })).status, 200);
  assert.deepEqual(messages[0][0].to, ['contact@linkersit.com']); assert.equal(messages[0][0].replyTo, 'alex@example.com');
  assert.equal(messages[0][0].from, 'LinkersIT <contact@linkersit.com>');
});
test('retries of the same submission use the same Resend idempotency key', async () => {
  const { submit, messages } = setup(); await submit(); await submit(); assert.equal(messages[0][1].idempotencyKey, messages[1][1].idempotencyKey);
});
test('CSRF mismatch and cross-site submissions are rejected before verification', async () => {
  const { submit, messages, verifications } = setup();
  assert.equal((await submit({ csrf: 'invalid' })).status, 403);
  assert.equal((await submit({}, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await submit({}, { Cookie: '' })).status, 403);
  assert.equal(messages.length + verifications.length, 0);
});
test('bad fields, honeypot and header injection never send', async () => {
  const { submit, messages, verifications } = setup();
  for (const patch of [{ email: 'person@example.com\r\nBcc: other@example.com' }, { firstName: [] }, { service: 'arbitrary' }, { website: 'spam' }, { message: 'x'.repeat(4001) }, { captcha: '' }]) assert.equal((await submit(patch)).status, 422);
  assert.equal((await submit({ message: 'x'.repeat(25000) })).status, 413);
  assert.equal(messages.length + verifications.length, 0);
});
test('invalid, wrong-host and expired reCAPTCHA responses fail closed', async () => {
  for (const result of [{ success: false }, { success: true, hostname: 'attacker.example', challenge_ts: new Date(now).toISOString() }, { success: true, hostname: 'linkersit.com', challenge_ts: new Date(now - 121000).toISOString() }]) {
    const { submit, messages } = setup({ fetchImpl: async () => Response.json(result) });
    assert.equal((await submit()).status, 422); assert.equal(messages.length, 0);
  }
});
test('connection failure never sends mail or reports success', async () => {
  const { submit, messages } = setup({ fetchImpl: async () => { throw new Error('network'); } });
  assert.equal((await submit()).status, 503); assert.equal(messages.length, 0);
});
test('rate limiting rejects before Google and Resend', async () => {
  const { submit, messages, verifications } = setup({ limiter: async () => false });
  const response = await submit(); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '3600'); assert.equal(messages.length + verifications.length, 0);
});
test('Resend failures do not produce success messages', async () => {
  const { submit } = setup({ sendEmail: async () => ({ data: null, error: { message: 'provider detail' } }) });
  const response = await submit(); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('provider detail'));
});
test('missing production credentials fail closed', async () => {
  const handlers = createContactHandlers({}); assert.equal((await handlers.GET(new Request('https://linkersit.com/api/contact'))).status, 503);
  assert.equal((await handlers.POST(new Request('https://linkersit.com/api/contact', { method: 'POST' }))).status, 503);
});
