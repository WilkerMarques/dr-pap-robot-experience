import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = typeof request.body === 'string'
      ? JSON.parse(request.body)
      : request.body;

    const { nome, hospital, whatsapp, maturidade } = body;

    if (!nome?.trim() || !hospital?.trim() || !whatsapp?.trim()) {
      return response.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const digits = String(whatsapp).replace(/\D/g, '');
    if (digits.length < 10) {
      return response.status(400).json({ error: 'WhatsApp inválido' });
    }

    await sql`
      INSERT INTO leads (nome, hospital, whatsapp, maturidade)
      VALUES (${nome.trim()}, ${hospital.trim()}, ${digits}, ${maturidade ?? null})
    `;

    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Erro ao salvar lead' });
  }
}