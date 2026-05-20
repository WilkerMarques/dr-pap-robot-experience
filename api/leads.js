import pg from 'pg';

const { Pool } = pg;

function getConnectionString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING
    || process.env.POSTGRES_URL
    || process.env.DATABASE_URL
  );
}

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

  const connectionString = getConnectionString();
  if (!connectionString) {
    return response.status(500).json({
      error: 'Banco não configurado',
      detail: 'Conecte o Postgres em Storage → Connect to Project e faça Redeploy.',
    });
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

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

    await pool.query(
      `INSERT INTO leads (nome, hospital, whatsapp, maturidade)
       VALUES ($1, $2, $3, $4)`,
      [nome.trim(), hospital.trim(), digits, maturidadeValue],
    );

    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('POST /api/leads', error);
    return response.status(500).json({
      error: 'Erro ao salvar lead',
      detail: error?.message ?? String(error),
    });
  } finally {
    await pool.end().catch(() => {});
  }
}
