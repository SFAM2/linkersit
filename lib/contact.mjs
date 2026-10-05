import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const recipient = 'contact@linkersit.com';
const services = ['', 'Technology consulting', 'Web & mobile engineering', 'Startup & MVP support', 'Product design & growth'];
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const buckets = new Map();
const hour = 3600000;
function reply(status, message, extra = {}, headers = {}) {
  return Response.json({ ok: status < 400, message, ...extra }, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...headers } });
}
function hmac(value, secret) { return createHmac('sha256', secret).update(value).digest('hex'); }
function equal(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function field(data, key, max, required = false, multiline = false) {
  const value = data[key] ?? '';
  if (typeof value !== 'string') throw new Error('validation');
  const text = value.trim();
  if (text.length > max || (required && !text) || (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(text)) throw new Error('validation');
  return text;
}
async function readBody(request) {
  if (Number(request.headers.get('content-length')) > 24000) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('validation');
  let size = 0; const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 24000) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('validation');
  return data;
}

// Optional shared Redis counter for multiple Vercel instances. Without Redis,
// this counter is best-effort per instance; reCAPTCHA is always mandatory.
async function rateLimit(key, env, fetchImpl, now) {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const response = await fetchImpl(env.UPSTASH_REDIS_REST_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],3600) end; return n", '1', `linkersit:contact:${key}`]),
      signal: AbortSignal.timeout(4000),
    });
    const result = await response.json();
    if (!response.ok || !Number.isInteger(result.result)) throw new Error('rate-limit-unavailable');
    return result.result <= 5;
  }
  for (const [id, item] of buckets) if (item.until <= now) buckets.delete(id);
  if (buckets.size >= 10000 && !buckets.has(key)) return false;
  const bucket = buckets.get(key) || { count: 0, until: now + hour };
  buckets.set(key, bucket); bucket.count++;
  return bucket.count <= 5;
}

export function createContactHandlers(env = process.env, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const now = dependencies.now || Date.now;
  const limiter = dependencies.limiter || ((key) => rateLimit(key, env, fetchImpl, now()));
  const sendEmail = dependencies.sendEmail || ((message, options) => new Resend(env.RESEND_API_KEY).emails.send(message, options));
  const config = () => ({
    siteKey: env.RECAPTCHA_SITE_KEY?.trim(), secret: env.RECAPTCHA_SECRET_KEY?.trim(),
    hosts: (env.RECAPTCHA_ALLOWED_HOSTS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean),
  });
  function validToken(token, secret) {
    if (typeof token !== 'string' || token.length > 200) return false;
    const [nonce, expires, signature] = token.split('.');
    return /^[a-f0-9]{48}$/.test(nonce || '') && Number(expires) > now() && Number(expires) <= now() + hour && equal(signature, hmac(`${nonce}.${expires}`, secret));
  }
  return {
    async GET(request) {
      if (request.headers.get('sec-fetch-site') === 'cross-site') return reply(403, 'Open verification from our website.');
      const { siteKey, secret, hosts } = config();
      if (!siteKey || !secret || !hosts.length) return reply(503, 'The online form is being configured. Please email contact@linkersit.com.');
      const payload = `${randomBytes(24).toString('hex')}.${now() + 30 * 60000}`;
      const csrf = `${payload}.${hmac(payload, secret)}`;
      const secure = new URL(request.url).protocol === 'https:' || env.VERCEL === '1';
      return reply(200, 'Verification ready.', { siteKey, csrf }, { 'Set-Cookie': `linkersit_form=${csrf}; Path=/; Max-Age=1800; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}` });
    },
    async POST(request) {
      const { secret, hosts } = config();
      if (!secret || !hosts.length || !env.RESEND_API_KEY || !emailPattern.test(env.CONTACT_FROM_EMAIL || '')) return reply(503, 'Email delivery is being configured. Please email contact@linkersit.com.');
      const origin = request.headers.get('origin');
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin)) return reply(403, 'Please send your enquiry from our website.');
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, 'Please use the website enquiry form.');
      let data, values;
      try {
        data = await readBody(request);
        const cookie = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('linkersit_form='))?.slice(15);
        if (!validToken(data.csrf, secret) || !equal(cookie, data.csrf)) return reply(403, 'Verification expired. Reload the page and try again.');
        values = {
          firstName: field(data, 'firstName', 80, true), lastName: field(data, 'lastName', 80),
          email: field(data, 'email', 160, true), phone: field(data, 'phone', 40),
          service: field(data, 'service', 80), message: field(data, 'message', 4000, true, true),
        };
        if (!emailPattern.test(values.email) || !services.includes(values.service) || field(data, 'website', 200)) throw new Error('validation');
        field(data, 'captcha', 4096, true);
        if (!/^[a-f0-9-]{36}$/i.test(field(data, 'submissionId', 36, true))) throw new Error('validation');
      } catch (error) { return reply(error.message === 'size' ? 413 : 422, 'Check the information in your form.'); }
      try {
        const ip = env.VERCEL === '1' ? (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim() : 'local';
        if (!await limiter(hmac(ip, secret))) return reply(429, 'Too many attempts. Please try again later.', {}, { 'Retry-After': '3600' });
        const response = await fetchImpl('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret, response: data.captcha }), signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return reply(503, 'Verification is temporarily unavailable. Please try again.');
        const result = await response.json();
        const timestamp = Date.parse(result.challenge_ts);
        if (result.success !== true || !hosts.includes(String(result.hostname).toLowerCase()) || !Number.isFinite(timestamp) || now() - timestamp > 120000 || timestamp > now() + 30000) return reply(422, 'Complete a new reCAPTCHA verification and try again.');
        const text = `New LinkersIT project enquiry\n\nName: ${values.firstName} ${values.lastName}\nEmail: ${values.email}\nPhone: ${values.phone}\nService: ${values.service}\n\n${values.message}\n`;
        const resultEmail = await sendEmail({ from: `LinkersIT <${env.CONTACT_FROM_EMAIL}>`, to: [recipient], replyTo: values.email, subject: 'LinkersIT project enquiry', text }, {
          idempotencyKey: `linkersit/${hmac(JSON.stringify([data.submissionId, values]), secret)}`, signal: AbortSignal.timeout(10000),
        });
        if (resultEmail.error || !resultEmail.data?.id) return reply(503, 'Your message could not be sent. Please retry or email contact@linkersit.com.');
        return reply(200, 'Thank you. Your enquiry has been accepted for delivery to our team.');
      } catch { return reply(503, 'We could not confirm delivery. Please retry or email contact@linkersit.com.'); }
    },
  };
}
