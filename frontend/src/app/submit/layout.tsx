/**
 * El flujo público trae su propio chrome completo (cabecera sticky, stepper,
 * fondo y barra de envío fija) en `SubmitWizardShell`, así que este layout es
 * deliberadamente un paso directo: cualquier envoltorio aquí duplicaría el
 * logo y rompería el `position: sticky` del encabezado del wizard.
 */
export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
