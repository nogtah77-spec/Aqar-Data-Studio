import { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle2, AlertTriangle, ArrowRight, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { parseFile, validateRows } from "@/lib/import-parser";
import { ImportedRow, useImportProperties, ImportInputMode } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<ImportedRow>[]>([]);
  const [validRows, setValidRows] = useState<ImportedRow[]>([]);
  const [errors, setErrors] = useState<{ index: number, row: any, issues: string[] }[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [mode, setMode] = useState<ImportInputMode>('merge');
  const [importResult, setImportResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const importProperties = useImportProperties();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setIsParsing(true);
    
    try {
      const rows = await parseFile(selected);
      setParsedRows(rows);
      const validation = validateRows(rows);
      setValidRows(validation.valid);
      setErrors(validation.errors);
      setStep(2);
    } catch (err: any) {
      toast({ title: "Failed to parse file", description: err.message, variant: "destructive" });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    
    setFile(dropped);
    setIsParsing(true);
    
    try {
      const rows = await parseFile(dropped);
      setParsedRows(rows);
      const validation = validateRows(rows);
      setValidRows(validation.valid);
      setErrors(validation.errors);
      setStep(2);
    } catch (err: any) {
      toast({ title: "Failed to parse file", description: err.message, variant: "destructive" });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setParsedRows([]);
    setValidRows([]);
    setErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    if (validRows.length === 0) return;
    
    importProperties.mutate({
      data: {
        items: validRows,
        mode,
        dryRun: false
      }
    }, {
      onSuccess: (res) => {
        setImportResult(res);
        setStep(3);
      },
      onError: (err: any) => {
        toast({ title: "Import failed", description: err.message || "Server error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground mt-1">
          Import properties from external files.
        </p>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -z-10 transform -translate-y-1/2" />
        
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-background transition-colors",
              step > s ? "bg-primary text-primary-foreground" : 
              step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            <span className={cn(
              "text-xs font-medium mt-2 absolute top-10",
              step >= s ? "text-foreground" : "text-muted-foreground"
            )}>
              {s === 1 ? "Upload" : s === 2 ? "Preview" : "Result"}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="mt-12">
          <CardContent className="pt-6">
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                isParsing ? "bg-muted/50 border-muted" : "hover:bg-muted/50 border-primary/20 hover:border-primary/50"
              )}
              onClick={() => !isParsing && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".csv,.txt,.json,.xlsx,.xls"
              />
              <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drag and drop file here</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Supports CSV, TXT, Excel (.xlsx), and JSON. First row should contain headers.
              </p>
              <Button disabled={isParsing}>
                {isParsing ? "Parsing..." : "Browse Files"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6 mt-12 animate-in slide-in-from-right-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <FileType className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File parsed</p>
                  <p className="text-lg font-semibold">{file?.name}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 text-green-600 rounded-full">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid Rows</p>
                  <p className="text-lg font-semibold text-green-600">{validRows.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errors</p>
                  <p className="text-lg font-semibold text-destructive">{errors.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configure Import</CardTitle>
                <CardDescription>How should conflicts be handled?</CardDescription>
              </div>
              <div className="w-48">
                <Select value={mode} onValueChange={(v) => setMode(v as ImportInputMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merge">Merge (Update/Insert)</SelectItem>
                    <SelectItem value="insert">Insert Only</SelectItem>
                    <SelectItem value="update">Update Only</SelectItem>
                    <SelectItem value="skip">Skip Duplicates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                    <TableRow>
                      <TableHead className="w-[50px]">Row</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 100).map((row, i) => {
                      const error = errors.find(e => e.index === i);
                      return (
                        <TableRow key={i} className={error ? "bg-destructive/5" : ""}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{row.code || <span className="text-destructive">Missing</span>}</TableCell>
                          <TableCell className="max-w-[200px] truncate" dir="auto">{row.title}</TableCell>
                          <TableCell>{row.price}</TableCell>
                          <TableCell>
                            {error ? (
                              <span className="text-xs text-destructive flex items-center gap-1" title={error.issues.join(', ')}>
                                <AlertTriangle className="h-3 w-3" /> Error
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Valid
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {parsedRows.length > 100 && (
                  <div className="text-center p-2 text-xs text-muted-foreground border-t">
                    Showing first 100 of {parsedRows.length} rows
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t p-6">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || importProperties.isPending}>
                {importProperties.isPending ? "Importing..." : "Start Import"} 
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {step === 3 && importResult && (
        <Card className="mt-12 animate-in slide-in-from-right-4">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Import Complete</CardTitle>
            <CardDescription>
              Successfully processed {parsedRows.length} records.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-foreground">{importResult.added}</div>
                <div className="text-sm font-medium text-muted-foreground">Added</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm font-medium text-muted-foreground">Updated</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-muted-foreground">{importResult.skipped}</div>
                <div className="text-sm font-medium text-muted-foreground">Skipped</div>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <div className="text-3xl font-bold text-destructive">{importResult.errors}</div>
                <div className="text-sm font-medium text-destructive">Failed</div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={() => window.location.href = '/properties'}>
                View Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}