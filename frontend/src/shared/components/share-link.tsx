'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { branding } from '@/config/branding';

/**
 * Los QR se leen de forma fiable en oscuro-sobre-claro; muchos escáneres fallan
 * con el patrón invertido. Por eso el código va sobre un panel blanco fijo en
 * vez de seguir el tema de la página.
 */
const QR_BACKGROUND = '#ffffff';
const QR_FOREGROUND = '#0b1320';

type ShareLinkProps = {
  className?: string;
  label?: string;
};

export function ShareLink({ className, label = 'Compartir esta página' }: ShareLinkProps) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La URL se lee en el cliente: en el servidor no existe, y fijarla en el HTML
  // provocaría un desajuste de hidratación entre entornos.
  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');

    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado');

      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard falla en contextos no seguros (http en un dominio distinto de localhost).
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo a mano.');
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: branding.name, text: branding.tagline, url });
    } catch (error) {
      // Cerrar la hoja de compartir lanza AbortError: es una cancelación, no un fallo.
      if ((error as Error)?.name !== 'AbortError') {
        toast.error('No se pudo abrir el menú de compartir');
      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={className}
        >
          <QrCode className="size-4" />
          {label}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Comparte el formulario</DialogTitle>
          <DialogDescription>
            Escanea el código o copia el enlace para enviarlo a tu área.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto w-fit rounded-2xl bg-white p-3">
          {url ? (
            <QRCodeSVG
              value={url}
              size={188}
              level="M"
              marginSize={2}
              bgColor={QR_BACKGROUND}
              fgColor={QR_FOREGROUND}
              title="Código QR con el enlace a esta página"
            />
          ) : (
            // Mismo tamaño que el QR, para que el diálogo no salte al montar.
            <div className="size-[188px] animate-pulse rounded-lg bg-muted" />
          )}
        </div>

        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-center text-xs break-all text-muted-foreground">
          {url || 'Cargando enlace…'}
        </p>

        <div className="flex flex-col gap-2">
          <Button type="button" variant="secondary" onClick={copyUrl} disabled={!url}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </Button>

          {canNativeShare ? (
            <Button type="button" onClick={nativeShare} disabled={!url}>
              <Share2 className="size-4" />
              Compartir
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
