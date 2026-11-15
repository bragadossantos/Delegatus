import { newId } from '../store';
import type { DatabaseSchema, PapelUsuario, TipoNotificacao } from '../types';

interface NotifyInput {
  turmaId: string;
  userId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  referenciaId?: string;
}

export function pushNotification(db: DatabaseSchema, input: NotifyInput): void {
  db.notificacoes.unshift({
    id: newId('notif'),
    turmaId: input.turmaId,
    userId: input.userId,
    tipo: input.tipo,
    titulo: input.titulo,
    mensagem: input.mensagem,
    lida: false,
    referenciaId: input.referenciaId,
    createdAt: new Date().toISOString(),
  });
}

export function notifyTurmaByRoles(
  db: DatabaseSchema,
  turmaId: string,
  roles: PapelUsuario[],
  input: Omit<NotifyInput, 'turmaId' | 'userId'>,
  excludeUserId?: string
): void {
  const targets = db.users.filter(
    (u) =>
      u.turmaId === turmaId &&
      roles.includes(u.papel) &&
      (!excludeUserId || u.id !== excludeUserId)
  );
  for (const target of targets) {
    pushNotification(db, {
      ...input,
      turmaId,
      userId: target.id,
    });
  }
}

export function notifyAllTurmaMembers(
  db: DatabaseSchema,
  turmaId: string,
  input: Omit<NotifyInput, 'turmaId' | 'userId'>,
  excludeUserId?: string
): void {
  notifyTurmaByRoles(db, turmaId, ['delegado', 'subdelegado', 'colega'], input, excludeUserId);
}
