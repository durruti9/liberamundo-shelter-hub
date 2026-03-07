import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF, EXPORT_CONFIGS } from '@/lib/export';

interface Props {
  getData: (type: string) => Record<string, any>[];
}

const SECTIONS = [
  { key: 'huespedes', icon: '🛏️', label: 'Huéspedes' },
  { key: 'incidencias', icon: '⚠️', label: 'Incidencias' },
  { key: 'sugerencias', icon: '📬', label: 'Sugerencias' },
  { key: 'llegadas', icon: '📅', label: 'Próximas llegadas' },
  { key: 'comedor', icon: '🍽️', label: 'Comedor' },
];

export default function ExportPanel({ getData }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (type: string, format: 'csv' | 'pdf') => {
    setExporting(`${type}-${format}`);
    try {
      const config = EXPORT_CONFIGS[type as keyof typeof EXPORT_CONFIGS];
      const data = getData(type);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${config.title}_${timestamp}`;

      if (format === 'csv') {
        exportToCSV(data, filename, config.columns);
      } else {
        exportToPDF(data, filename, config.columns, config.title);
      }
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Exportar datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SECTIONS.map(s => (
          <div key={s.key} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
            <span className="text-sm flex items-center gap-2">
              <span>{s.icon}</span> {s.label}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleExport(s.key, 'csv')}
                disabled={exporting === `${s.key}-csv`}
              >
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleExport(s.key, 'pdf')}
                disabled={exporting === `${s.key}-pdf`}
              >
                <FileText className="w-3 h-3" /> PDF
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
