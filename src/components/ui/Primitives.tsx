import React, { useRef } from 'react';
import type { PapelUsuario } from '@/api/types';
import { IconCopy, IconShield, IconUpload, IconWhatsApp, IconX } from './Icons';

export function RoleBadge({ papel }: { papel: PapelUsuario }) {
  if (papel === 'delegado') {
    return (
      <span className="badge badge-primary">
        <IconShield size={12} />
        Delegado
      </span>
    );
  }
  if (papel === 'subdelegado') {
    return (
      <span className="badge badge-info">
        <IconShield size={12} />
        Subdelegado
      </span>
    );
  }
  return <span className="badge badge-neutral">Colega</span>;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-h2">{title}</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Fechar"
            style={{ padding: 0, width: 44, height: 44 }}
          >
            <IconX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="card flex flex-col items-center justify-center gap-3"
      style={{ padding: '36px 20px', textAlign: 'center' }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 9999,
          backgroundColor: 'var(--color-primary-soft)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-h3">{title}</h3>
        <p className="text-sm text-secondary mt-1" style={{ margin: '4px 0 0' }}>
          {description}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

interface ImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  onError?: (msg: string) => void;
}

export function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Seleciona apenas ficheiros de imagem (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onError?.('A imagem deve ter no máximo 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (value) {
    return (
      <div style={{ position: 'relative' }}>
        <img
          src={value}
          alt="Pré-visualização da imagem"
          style={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'cover',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            display: 'block',
          }}
        />
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onChange('')}
          aria-label="Remover imagem"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 44,
            height: 44,
            padding: 0,
            borderRadius: 9999,
          }}
        >
          <IconX size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className="upload-dropzone w-full"
        onClick={() => inputRef.current?.click()}
      >
        <IconUpload size={24} />
        <span className="text-sm font-semibold">Carregar foto ou tirar fotografia</span>
        <span className="text-xs text-muted">PNG, JPG ou WEBP até 4MB</span>
      </button>
    </div>
  );
}

interface WhatsAppShareModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  textoFormatado: string;
  waMeUrl: string;
  onCopySuccess?: () => void;
}

export function WhatsAppShareModal({
  open,
  onClose,
  title = 'Partilhar no WhatsApp',
  textoFormatado,
  waMeUrl,
  onCopySuccess,
}: WhatsAppShareModalProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textoFormatado);
      onCopySuccess?.();
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold text-muted">PRÉ-VISUALIZAÇÃO DA MENSAGEM</span>
          <pre
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'var(--bg-surface-muted)',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              margin: '8px 0 0',
            }}
          >
            {textoFormatado}
          </pre>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={waMeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-full"
          >
            <IconWhatsApp size={18} />
            Abrir no WhatsApp
          </a>
          <button type="button" className="btn btn-outline btn-full" onClick={handleCopy}>
            <IconCopy size={18} />
            Copiar Texto
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}
