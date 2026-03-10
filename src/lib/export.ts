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
  options?: {
    empresa?: string;
    cif?: string;
    legalText?: string;
    employeeName?: string;
    signatures?: { fecha: string; firma_data: string }[];
  }
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

  let finalY = (doc as any).lastAutoTable?.finalY || 200;

  // Add signatures section if available
  if (options?.signatures && options.signatures.length > 0) {
    const validSigs = options.signatures.filter(s => s.firma_data && s.firma_data.startsWith('data:'));
    if (validSigs.length > 0) {
      finalY += 8;
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text('Firmas del trabajador/a:', 14, finalY);
      finalY += 4;

      const sigWidth = 40;
      const sigHeight = 20;
      const cols = 5;
      let col = 0;

      validSigs.forEach((sig) => {
        const x = 14 + col * (sigWidth + 10);
        const y = finalY;
        
        if (y + sigHeight + 10 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          finalY = 20;
        }

        try {
          doc.addImage(sig.firma_data, 'PNG', x, y, sigWidth, sigHeight);
          doc.setFontSize(6);
          doc.setTextColor(120);
          doc.text(sig.fecha, x + sigWidth / 2, y + sigHeight + 3, { align: 'center' });
        } catch {
          // Skip invalid signature images
        }

        col++;
        if (col >= cols) {
          col = 0;
          finalY += sigHeight + 8;
        }
      });

      if (col > 0) finalY += sigHeight + 8;
    }
  }

  // Legal footer text
  if (options?.legalText) {
    if (finalY + 15 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(options.legalText, 14, finalY + 5);

    // Signature lines
    finalY += 15;
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text('Firma del trabajador/a:', 14, finalY);
    doc.line(14, finalY + 15, 100, finalY + 15);
    doc.text('Firma de la empresa:', 160, finalY);
    doc.line(160, finalY + 15, 260, finalY + 15);
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
  inventario: {
    title: 'Inventario',
    columns: [
      { key: 'nombre', label: 'Artículo' },
      { key: 'categoria_nombre', label: 'Categoría' },
      { key: 'stock_actual', label: 'Stock actual' },
      { key: 'stock_minimo', label: 'Stock mínimo' },
      { key: 'unidad', label: 'Unidad' },
      { key: 'ubicacion', label: 'Ubicación' },
      { key: 'notas', label: 'Notas' },
    ],
  },
  movimientos: {
    title: 'Historial de movimientos',
    columns: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'item_nombre', label: 'Artículo' },
      { key: 'categoria_nombre', label: 'Categoría' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'motivo', label: 'Motivo' },
    ],
  },
  informes: {
    title: 'Informe de ocupación',
    columns: [
      { key: 'mes', label: 'Mes' },
      { key: 'ocupacion', label: 'Ocupación %' },
      { key: 'entradas', label: 'Entradas' },
      { key: 'salidas', label: 'Salidas' },
    ],
  },
  resumenHorasEmpleados: {
    title: 'Resumen de horas por empleado',
    columns: [
      { key: 'empleado', label: 'Empleado' },
      { key: 'dias_trabajados', label: 'Días trabajados' },
      { key: 'horas_ordinarias', label: 'H. Ordinarias' },
      { key: 'horas_extra', label: 'H. Extra' },
      { key: 'horas_totales', label: 'H. Totales' },
      { key: 'dias_vacaciones', label: 'Días vacaciones' },
      { key: 'dias_baja', label: 'Días baja' },
      { key: 'dias_permiso', label: 'Días permiso' },
      { key: 'dias_sin_firmar', label: 'Sin firmar' },
    ],
  },
  estadisticasTareas: {
    title: 'Estadísticas de tareas mensuales',
    columns: [
      { key: 'trabajador', label: 'Trabajador' },
      { key: 'total_realizadas', label: 'Tareas realizadas' },
      { key: 'total_pendientes', label: 'Pendientes' },
      { key: 'total_no_procede', label: 'No procede' },
      { key: 'porcentaje', label: '% Completado' },
    ],
  },
};
