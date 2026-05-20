import { createPool } from '@vercel/postgres';

const pool = createPool();

async function readJsonBody(request) {
  if (request.body) {
    return typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido' });
  }

  if (!process.env.POSTGRES_URL) {
    return response.status(500).json({
      error: 'POSTGRES_URL não configurada. Conecte o Storage ao projeto e faça Redeploy.',
    });
  }

  try {
    const body = await readJsonBody(request);
    const { nome, hospital, whatsapp, maturidade } = body ?? {};

    if (!nome?.trim() || !hospital?.trim() || !whatsapp?.trim()) {
      return response.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const digits = String(whatsapp).replace(/\D/g, '');
    if (digits.length < 10) {
      return response.status(400).json({ error: 'WhatsApp inválido' });
    }

    const maturidadeValue = maturidade === null || maturidade === undefined || maturidade === ''
      ? null
      : Number(maturidade);

    await pool.sql`
      INSERT INTO leads (nome, hospital, whatsapp, maturidade)
      VALUES (${nome.trim()}, ${hospital.trim()}, ${digits}, ${maturidadeValue})
    `;

    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('POST /api/leads', error);
    return response.status(500).json({
      error: 'Erro ao salvar lead',
      detail: error?.message ?? String(error),
    });
  }
}
