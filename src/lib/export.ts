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
  title: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(`Exportado: ${new Date().toLocaleString('es-ES')}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map(c => c.label)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 28 },
  });

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
};
