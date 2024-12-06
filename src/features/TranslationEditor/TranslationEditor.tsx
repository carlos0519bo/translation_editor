import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, Download, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TranslationData {
  [key: string]: {
    defaultMessage: string;
  };
}

interface TranslationEntry {
  id: string;
  key: string;
  defaultMessage: string;
}

export const TranslationEditor: React.FC = () => {
  const [translationEntries, setTranslationEntries] = useState<TranslationEntry[]>([]);
  const [originalData, setOriginalData] = useState<TranslationData>({});
  const [showFloatingDownload, setShowFloatingDownload] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingDownload(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        try {
          const jsonData = JSON.parse(e.target?.result as string) as TranslationData;
          setOriginalData(jsonData);

          const entries = Object.entries(jsonData).map(([key, value]) => ({
            id: key,
            key: key,
            defaultMessage: value.defaultMessage
          }));
          setTranslationEntries(entries);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Error al procesar el archivo JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePropertyChange = (id: string, newKey: string): void => {
    setTranslationEntries(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, key: newKey } : entry
      )
    );
  };

  const handleTranslationChange = (id: string, newTranslation: string): void => {
    setTranslationEntries(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, defaultMessage: newTranslation } : entry
      )
    );
  };

  const isModified = (entry: TranslationEntry): boolean => {
    return originalData[entry.id]?.defaultMessage !== entry.defaultMessage || 
           !Object.prototype.hasOwnProperty.call(originalData, entry.id);
  };

  const isNewTranslation = (entry: TranslationEntry): boolean => {
    return !Object.prototype.hasOwnProperty.call(originalData, entry.id);
  };

  const isEmptyNewEntry = (entry: TranslationEntry): boolean => {
    return isNewTranslation(entry) && (entry.key.trim() === '' || entry.defaultMessage.trim() === '');
  };

  const handleDownloadClick = (): void => {
    // Establecer el nombre del archivo inicial para el modal
    setDownloadFileName(fileName.replace('.json', '') || 'translations');
    setIsDownloadModalOpen(true);
  };

  const downloadJSON = (): void => {
    const validEntries = translationEntries.filter(entry => 
      !isNewTranslation(entry) || (entry.key.trim() !== '' && entry.defaultMessage.trim() !== '')
    );

    const translationsObject = validEntries.reduce((acc, entry) => {
      acc[entry.key] = { defaultMessage: entry.defaultMessage };
      return acc;
    }, {} as TranslationData);

    const dataStr = JSON.stringify(translationsObject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Asegurarse de que el nombre del archivo termine en .json
    const finalFileName = downloadFileName.replace(/\.json$/, '') + '.json';
    link.download = finalFileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Cerrar el modal después de la descarga
    setIsDownloadModalOpen(false);
  };

  const addNewTranslation = (): void => {
    const newEntry: TranslationEntry = {
      id: Date.now().toString(),
      key: '',
      defaultMessage: ''
    };
    setTranslationEntries(entries => [...entries, newEntry]);

    setTimeout(() => {
      tableEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const showDownloadButton = translationEntries.length > 0;

  return (
    <div className="relative">
      <Card className="w-full max-w-4xl mx-auto mt-4">
        <CardHeader>
          <CardTitle className="text-2xl flex justify-between">
            Editor de traducciones
            <div className="text-xl">{fileName && ` ${fileName}`}</div>
          </CardTitle>
          <div className="flex justify-between">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Subir JSON
            </Button>
            <Button
              onClick={handleDownloadClick}
              className={`items-center gap-2 ${
                showDownloadButton ? 'flex' : 'hidden'
              }`}
            >
              <Download className="w-4 h-4" />
              Descargar JSON
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </CardHeader>
        <CardContent>
          {translationEntries.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Traducción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`
                        ${isEmptyNewEntry(entry) ? 'opacity-50' : ''}
                        ${isNewTranslation(entry) ? 'bg-green-50' : isModified(entry) ? 'bg-blue-50' : ''}
                      `}
                    >
                      <TableCell>
                        <Input
                          value={entry.key}
                          onChange={(e) =>
                            handlePropertyChange(entry.id, e.target.value)
                          }
                          placeholder="Introduce la clave de traducción"
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.defaultMessage}
                          onChange={(e) =>
                            handleTranslationChange(entry.id, e.target.value)
                          }
                          placeholder="Introduce el texto de la traducción"
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div ref={tableEndRef} />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Sube un archivo JSON para comenzar a editar las traducciones
            </div>
          )}
        </CardContent>
      </Card>

      {showDownloadButton && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          {showFloatingDownload && (
            <Button
              onClick={handleDownloadClick}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg"
            >
              <Download className="w-6 h-6" />
            </Button>
          )}
          <Button
            onClick={addNewTranslation}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}

      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar archivo JSON</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="filename" className="text-sm font-medium leading-none">
                Nombre del archivo
              </label>
              <Input
                id="filename"
                value={downloadFileName}
                onChange={(e) => setDownloadFileName(e.target.value)}
                placeholder="Nombre del archivo"
              />
              <p className="text-sm text-gray-500">
                La extensión .json se agregará automáticamente
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDownloadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={downloadJSON}>
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-gray-500 text-center py-6">By Carlos López</p>
    </div>
  );
};