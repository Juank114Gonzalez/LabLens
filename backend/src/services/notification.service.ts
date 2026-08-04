import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

type WorkTableSummary = {
  nombre: string;
  notificationEmail: string | null;
};

type InitiativeSummary = {
  id: string;
  nombre: string;
  areaProcesoImpactado: string;
  urgencia: string;
  impacto: string;
  necesidad: string;
  porQueAhora: string;
  paraQue: string;
  submitterName: string | null;
  submitterEmail: string | null;
};

type TriageSummary = {
  classificationName: string;
  classificationReasoning: string;
  workTableReasoning: string;
  confidence: number;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) {
    return null;
  }

  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  return transporter;
}

function buildBody(input: {
  workTable: WorkTableSummary;
  initiative: InitiativeSummary;
  triage: TriageSummary;
}): string {
  const { initiative, triage, workTable } = input;
  const detailUrl = `${env.FRONTEND_ORIGIN}/initiatives/${initiative.id}`;
  const submitter = initiative.submitterName
    ? `${initiative.submitterName}${initiative.submitterEmail ? ` <${initiative.submitterEmail}>` : ''}`
    : 'No informado';

  return [
    `El Comité Virtual de Innovación recibió una iniciativa que corresponde a ${workTable.nombre}.`,
    '',
    `Iniciativa: ${initiative.nombre}`,
    `Área / proceso impactado: ${initiative.areaProcesoImpactado}`,
    `Urgencia: ${initiative.urgencia}`,
    `Impacto: ${initiative.impacto}`,
    `Enviada por: ${submitter}`,
    '',
    `Clasificación asignada: ${triage.classificationName} (confianza ${Math.round(triage.confidence * 100)}%)`,
    `Justificación: ${triage.classificationReasoning}`,
    `Motivo del enrutamiento: ${triage.workTableReasoning}`,
    '',
    '¿Qué necesita?',
    initiative.necesidad,
    '',
    '¿Por qué ahora?',
    initiative.porQueAhora,
    '',
    '¿Para qué?',
    initiative.paraQue,
    '',
    `Detalle completo: ${detailUrl}`,
  ].join('\n');
}

/**
 * Notifies the work table that owns an initiative routed out of the Lab.
 * Never throws: a failed notification must not roll back a completed triage.
 * Returns true only when the message was actually handed to the SMTP server.
 */
export async function notifyWorkTable(input: {
  workTable: WorkTableSummary;
  initiative: InitiativeSummary;
  triage: TriageSummary;
}): Promise<boolean> {
  const recipient = input.workTable.notificationEmail;

  if (!recipient) {
    console.warn(
      `[NotificationService] Work table "${input.workTable.nombre}" has no notificationEmail configured`,
    );
    return false;
  }

  const mailer = getTransporter();
  if (!mailer) {
    console.warn(
      `[NotificationService] SMTP not configured; skipped notification to ${recipient}`,
    );
    return false;
  }

  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: recipient,
      subject: `[Comité Virtual] Nueva iniciativa clasificada como ${input.triage.classificationName}`,
      text: buildBody(input),
    });
    return true;
  } catch (error) {
    console.error('[NotificationService] Failed to send notification', error);
    return false;
  }
}
