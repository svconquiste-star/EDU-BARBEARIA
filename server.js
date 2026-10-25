require('dotenv').config();
const path = require('path');
const express = require('express');
const { Pool } = require('pg');

const SERVICOS = ['AGENDAR ATENDIMENTO', 'QUERO TIRAR DÚVIDAS'];
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function prepararBanco() {
  await pool.query('CREATE SCHEMA IF NOT EXISTS "Barbearia_Edu"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Barbearia_Edu".leads (
      id         SERIAL PRIMARY KEY,
      nome       TEXT NOT NULL,
      telefone   TEXT NOT NULL,
      cidade     TEXT NOT NULL,
      servico    TEXT NOT NULL CHECK (servico IN ('AGENDAR ATENDIMENTO','QUERO TIRAR DÚVIDAS')),
      origem     TEXT,
      user_agent TEXT,
      criado_em  TIMESTAMPTZ DEFAULT now()
    )`);
  await pool.query('ALTER TABLE "Barbearia_Edu".leads ADD COLUMN IF NOT EXISTS cidade TEXT');
  console.log('Banco: tabela "Barbearia_Edu".leads pronta');
}

app.post('/api/leads', async (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const telefone = String(req.body.telefone || '').replace(/\D/g, '');
  const cidade = String(req.body.cidade || '').trim();
  const servico = String(req.body.servico || '');
  const origem = String(req.body.origem || '').slice(0, 500) || null;

  if (nome.length < 2 || nome.length > 120) return res.status(400).json({ erro: 'Nome inválido' });
  if (telefone.length < 10 || telefone.length > 11) return res.status(400).json({ erro: 'Telefone inválido' });
  if (cidade.length < 2 || cidade.length > 120) return res.status(400).json({ erro: 'Cidade inválida' });
  if (!SERVICOS.includes(servico)) return res.status(400).json({ erro: 'Serviço inválido' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO "Barbearia_Edu".leads (nome, telefone, cidade, servico, origem, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nome, telefone, cidade, servico, origem, String(req.headers['user-agent'] || '').slice(0, 300)]
    );
    res.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('Erro ao salvar lead:', err.message);
    res.status(500).json({ erro: 'Falha ao salvar' });
  }
});

const PORT = process.env.PORT || 3000;
prepararBanco()
  .catch((err) => console.error('Erro ao preparar banco:', err.message))
  .finally(() => app.listen(PORT, () => console.log(`LP rodando em http://localhost:${PORT}`)));
