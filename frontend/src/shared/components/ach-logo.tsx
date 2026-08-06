import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Dimensiones intrínsecas de `public/Logo.png` (relación 2.37:1). */
const LOGO_WIDTH = 732;
const LOGO_HEIGHT = 309;

/**
 * Marca institucional de ACH Colombia: blanco sobre transparente, así que solo
 * es legible sobre superficies oscuras (todo el producto corre en modo dark).
 */
export function AchLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/Logo.png"
      alt="ACH Colombia"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority
      className={cn('h-8 w-auto select-none', className)}
    />
  );
}
