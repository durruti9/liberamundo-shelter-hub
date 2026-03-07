import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF, EXPORT_CONFIGS } from '@/lib/export';

interface Props {
  type: keyof typeof EXPORT_CONFIGS;
  getData: () => Record<string, any>[];
}

export default function ExportButton({ type, getData }: Props) {
  const config = EXPORT_CONFIGS[type];
  const timestamp = new Date().toISOString().slice(0, 10);

  const handleExport = (format: 'csv' | 'pdf') => {
    const data = getData();
    const filename = `${config.title}_${timestamp}`;
    if (format === 'csv') {
      exportToCSV(data, filename, config.columns);
    } else {
      exportToPDF(data, filename, config.columns, config.title);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
          <FileText className="w-4 h-4" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
