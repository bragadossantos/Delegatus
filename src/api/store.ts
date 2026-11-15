import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSchema } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'delegatus-db.json');

let memoryDb: DatabaseSchema | null = null;

function createEmptyDb(): DatabaseSchema {
  return {
    users: [],
    turmas: [],
    pedidosEntrada: [],
    anuncios: [],
    faltas: [],
    horarios: [],
    materias: [],
    faltasProfessores: [],
    atividades: [],
    anexos: [],
    grupos: [],
    sondagens: [],
    notificacoes: [],
  };
}

function createSeedDb(): DatabaseSchema {
  const now = new Date().toISOString();
  const salt = 'delegatusseed01';
  const defaultPassHash = `${salt}:${crypto.scryptSync('123456', salt, 64).toString('hex')}`;

  const turmaId = 'turma-demo-1';
  const delegadoId = 'user-delegado-1';
  const subdelegadoId = 'user-sub-1';
  const colega1Id = 'user-colega-1';
  const colega2Id = 'user-colega-2';

  return {
    users: [
      {
        id: delegadoId,
        nome: 'Ana Beatriz Silva',
        email: 'delegado@delegatus.app',
        passwordHash: defaultPassHash,
        escolaUniversidade: 'Universidade de Lisboa — IST',
        nivelEnsino: 'universitario',
        curso: 'Engenharia Informática',
        turmaId,
        papel: 'delegado',
        createdAt: now,
      },
      {
        id: subdelegadoId,
        nome: 'Bruno Costa',
        email: 'subdelegado@delegatus.app',
        passwordHash: defaultPassHash,
        escolaUniversidade: 'Universidade de Lisboa — IST',
        nivelEnsino: 'universitario',
        curso: 'Engenharia Informática',
        turmaId,
        papel: 'subdelegado',
        createdAt: now,
      },
      {
        id: colega1Id,
        nome: 'Carla Mendes',
        email: 'carla@delegatus.app',
        passwordHash: defaultPassHash,
        escolaUniversidade: 'Universidade de Lisboa — IST',
        nivelEnsino: 'universitario',
        curso: 'Engenharia Informática',
        turmaId,
        papel: 'colega',
        createdAt: now,
      },
      {
        id: colega2Id,
        nome: 'Diogo Ferreira',
        email: 'diogo@delegatus.app',
        passwordHash: defaultPassHash,
        escolaUniversidade: 'Universidade de Lisboa — IST',
        nivelEnsino: 'universitario',
        curso: 'Engenharia Informática',
        turmaId,
        papel: 'colega',
        createdAt: now,
      },
    ],
    turmas: [
      {
        id: turmaId,
        nome: 'LEIC 2º Ano — Turma A',
        escolaUniversidade: 'Universidade de Lisboa — IST',
        curso: 'Engenharia Informática',
        anoLetivo: '2026/2027',
        codigoConvite: 'LEIC2A',
        delegadoId,
        linkGrupoWhatsapp: 'https://chat.whatsapp.com/DelegatusDemo',
        createdAt: now,
      },
    ],
    pedidosEntrada: [],
    anuncios: [
      {
        id: 'anuncio-1',
        turmaId,
        autorId: delegadoId,
        autorNome: 'Ana Beatriz Silva',
        titulo: 'Bem-vindos à turma na Delegatus!',
        conteudo:
          'Aqui vamos centralizar horários, avisos de falta, grupos de trabalho e sondagens. Qualquer dúvida falem comigo ou com o subdelegado.',
        fixado: true,
        disparadoWhatsapp: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    faltas: [
      {
        id: 'falta-1',
        turmaId,
        alunoId: colega1Id,
        alunoNome: 'Carla Mendes',
        data: now.slice(0, 10),
        disciplina: 'Sistemas Operativos',
        motivo: 'doenca',
        descricao: 'Consulta médica de manhã, entrego justificação amanhã.',
        status: 'pendente',
        createdAt: now,
      },
    ],
    horarios: [
      {
        id: 'hor-1',
        turmaId,
        diaSemana: 'segunda',
        horaInicio: '09:00',
        horaFim: '11:00',
        disciplina: 'Sistemas Operativos',
        sala: 'Lab 4',
        professor: 'Prof. Ricardo Alves',
        createdAt: now,
      },
      {
        id: 'hor-2',
        turmaId,
        diaSemana: 'terca',
        horaInicio: '14:00',
        horaFim: '16:00',
        disciplina: 'Bases de Dados',
        sala: 'Anfiteatro B2',
        professor: 'Profa. Helena Martins',
        createdAt: now,
      },
    ],
    materias: [
      {
        id: 'mat-1',
        turmaId,
        nome: 'Sistemas Operativos',
        professor: 'Prof. Ricardo Alves',
        ementaResumo: 'Processos, threads, escalonamento, memória virtual e sistemas de ficheiros.',
        createdAt: now,
      },
    ],
    faltasProfessores: [],
    atividades: [
      {
        id: 'ativ-1',
        turmaId,
        titulo: 'Entrega Projeto Fase 1',
        disciplina: 'Bases de Dados',
        tipo: 'trabalho',
        dataEntrega: now.slice(0, 10),
        descricao: 'Submeter modelo ER e script SQL no portal académico até às 23:59.',
        concluida: false,
        autorId: delegadoId,
        createdAt: now,
      },
    ],
    anexos: [],
    grupos: [
      {
        id: 'grp-1',
        turmaId,
        loteId: 'lote-demo-1',
        nome: 'Grupo 1',
        tema: 'Arquitetura Distribuída',
        disciplina: 'Sistemas Operativos',
        modo: 'livre',
        limiteVagas: 5,
        membros: [{ userId: colega1Id, nome: 'Carla Mendes' }],
        createdAt: now,
      },
      {
        id: 'grp-2',
        turmaId,
        loteId: 'lote-demo-1',
        nome: 'Grupo 2',
        tema: 'Segurança e Permissões',
        disciplina: 'Sistemas Operativos',
        modo: 'livre',
        limiteVagas: 5,
        membros: [],
        createdAt: now,
      },
    ],
    sondagens: [
      {
        id: 'sond-1',
        turmaId,
        autorId: delegadoId,
        autorNome: 'Ana Beatriz Silva',
        titulo: 'Melhor horário para revisão de Bases de Dados?',
        descricao: 'Votem na opção que dá jeito à maioria da turma.',
        opcoes: [
          { id: 'opt-1', texto: 'Quinta-feira às 17:00' },
          { id: 'opt-2', texto: 'Sexta-feira às 11:00' },
          { id: 'opt-3', texto: 'Sábado de manhã (online)' },
        ],
        votos: [{ userId: colega1Id, opcaoId: 'opt-1', createdAt: now }],
        encerrada: false,
        createdAt: now,
      },
    ],
    notificacoes: [
      {
        id: 'notif-1',
        turmaId,
        userId: delegadoId,
        tipo: 'nova_falta',
        titulo: 'Novo aviso de falta',
        mensagem: 'Carla Mendes registou falta em Sistemas Operativos (Doença).',
        lida: false,
        referenciaId: 'falta-1',
        createdAt: now,
      },
    ],
  };
}

function ensureLoaded(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      memoryDb = { ...createEmptyDb(), ...parsed };
      return memoryDb;
    }
  } catch (err) {
    console.warn('[Delegatus Store] Falha ao ler DB, a recriar seed:', err);
  }

  memoryDb = createSeedDb();
  persistDb(memoryDb);
  return memoryDb;
}

function persistDb(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.warn('[Delegatus Store] Falha ao persistir em disco (mantendo em memória):', err);
  }
}

export function readDb(): DatabaseSchema {
  return ensureLoaded();
}

export function mutateDb<T>(mutator: (db: DatabaseSchema) => T): T {
  const db = ensureLoaded();
  const result = mutator(db);
  persistDb(db);
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}
