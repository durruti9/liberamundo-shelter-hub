import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── CSV/Excel Export ───
export function exportToCSV(data: Record<string, any>[], filename: string, columns: { key: string; label: string }[]) {
  const BOM = '\uFEFF';
  const header = columns.map(c => `"${c.label}"`).join(';');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(';')
  );
  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ─── PDF Export ───
export function exportToPDF(
  data: Record<string, any>[],
  filename: string,
  columns: { key: string; label: string }[],
  title: string,
  options?: { empresa?: string; cif?: string; legalText?: string; employeeName?: string }
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  let yPos = 12;

  // Empresa header if provided
  if (options?.empresa || options?.cif) {
    doc.setFontSize(10);
    doc.setTextColor(60);
    const empresaLine = [
      options.empresa ? `EMPRESA: ${options.empresa}` : '',
      options.cif ? `CIF: ${options.cif}` : '',
    ].filter(Boolean).join('  |  ');
    doc.text(empresaLine, 14, yPos);
    yPos += 7;
  }

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, 14, yPos);
  yPos += 6;

  if (options?.employeeName) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Trabajador/a: ${options.employeeName}`, 14, yPos);
    yPos += 5;
  }

  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(`Exportado: ${new Date().toLocaleString('es-ES')}`, 14, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [columns.map(c => c.label)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: yPos },
  });

  // Legal footer text
  if (options?.legalText) {
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(options.legalText, 14, finalY + 10);
  }

  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Column definitions ───
export const EXPORT_CONFIGS = {
  huespedes: {
    title: 'Huéspedes',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'nie', label: 'NIE' },
      { key: 'nacionalidad', label: 'Nacionalidad' },
      { key: 'idioma', label: 'Idioma' },
      { key: 'dieta', label: 'Dieta' },
      { key: 'habitacion', label: 'Habitación' },
      { key: 'cama', label: 'Cama' },
      { key: 'fechaEntrada', label: 'Fecha entrada' },
      { key: 'estado', label: 'Estado' },
      { key: 'notas', label: 'Notas' },
    ],
  },
  incidencias: {
    title: 'Incidencias',
    columns: [
      { key: 'huespedNombre', label: 'Huésped' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'resuelta', label: 'Resuelta' },
      { key: 'creadoPor', label: 'Creado por' },
    ],
  },
  sugerencias: {
    title: 'Sugerencias',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'mensaje', label: 'Mensaje' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'email', label: 'Email' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'resuelta', label: 'Resuelta' },
      { key: 'respuesta', label: 'Respuesta' },
    ],
  },
  llegadas: {
    title: 'Próximas llegadas',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'nie', label: 'NIE' },
      { key: 'nacionalidad', label: 'Nacionalidad' },
      { key: 'idioma', label: 'Idioma' },
      { key: 'dieta', label: 'Dieta' },
      { key: 'fechaLlegada', label: 'Fecha llegada' },
      { key: 'habitacionAsignada', label: 'Habitación' },
      { key: 'notas', label: 'Notas' },
    ],
  },
  comedor: {
    title: 'Comedor',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'dieta', label: 'Dieta' },
      { key: 'estado', label: 'Estado' },
      { key: 'particularidades', label: 'Particularidades' },
    { key: 'observaciones', label: 'Observaciones' },
    ],
  },
  historial: {
    title: 'Historial de huéspedes',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'nie', label: 'NIE' },
      { key: 'nacionalidad', label: 'Nacionalidad' },
      { key: 'idioma', label: 'Idioma' },
      { key: 'dieta', label: 'Dieta' },
      { key: 'habitacion', label: 'Habitación' },
      { key: 'cama', label: 'Cama' },
      { key: 'fechaEntrada', label: 'Fecha entrada' },
      { key: 'fechaCheckout', label: 'Fecha salida' },
      { key: 'estado', label: 'Estado' },
      { key: 'notas', label: 'Notas' },
    ],
  },
  tareas: {
    title: 'Tareas del día',
    columns: [
      { key: 'tarea', label: 'Tarea' },
      { key: 'estado', label: 'Estado' },
      { key: 'turno', label: 'Turno' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'observaciones', label: 'Observaciones' },
    ],
  },
  registroHorario: {
    title: 'Registro Horario',
    columns: [
      { key: 'Día', label: 'Día' },
      { key: 'Estado', label: 'Estado' },
      { key: 'E. Mañana', label: 'E. Mañana' },
      { key: 'S. Mañana', label: 'S. Mañana' },
      { key: 'E. Tarde', label: 'E. Tarde' },
      { key: 'S. Tarde', label: 'S. Tarde' },
      { key: 'E. Noche', label: 'E. Noche' },
      { key: 'S. Noche', label: 'S. Noche' },
      { key: 'Pausa', label: 'Pausa' },
      { key: 'Ordinarias', label: 'Ordinarias' },
      { key: 'Extra', label: 'Extra' },
      { key: 'Total', label: 'Total' },
      { key: 'Firmado', label: 'Firmado' },
    ],
  },
};
