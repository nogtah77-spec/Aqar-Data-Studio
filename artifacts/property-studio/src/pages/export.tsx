import { useState } from "react";
import { useListProperties, useExportProperties, useListRegions, useListPropertyTypes, useListLookupOptions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, GripVertical, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { allColumns, generateClientExport, downloadBlob } from "@/lib/export-engine";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function ExportStudio() {
  const { toast } = useToast();
  
  // Filter states
  const [regionId, setRegionId] = useState<string>("all");
  const [typeId, setTypeId] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  // Export config states
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "json" | "txt">("excel");
  const [encoding, setEncoding] = useState<"utf-8" | "utf-8-bom" | "windows-1256">("utf-8-bom");
  const [filename, setFilename] = useState(`properties_${format(new Date(), 'yyyy-MM-dd')}`);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns.map(c => c.id));
  
  const { data: regions } = useListRegions();
  const { data: types } = useListPropertyTypes();
  const { data: categories } = useListLookupOptions({ category: "category" });
  const { data: statuses } = useListLookupOptions({ category: "status" });

  // For client side export and preview
  const { data: propertiesList, isLoading: isLoadingProps } = useListProperties({
    limit: 1000, // Export up to 1000 items in client side
    regionId: regionId !== "all" ? regionId : undefined,
    typeId: typeId !== "all" ? typeId : undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
  });

  const exportMutation = useExportProperties();

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({ title: "No columns selected", variant: "destructive" });
      return;
    }

    const finalFilename = `${filename}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
    
    try {
      if (exportFormat === 'excel') {
        // Use API for Excel to generate proper XLSX
        exportMutation.mutate({
          data: {
            format: "excel",
            columns: selectedColumns,
            filters: {
              regionId: regionId !== "all" ? regionId : undefined,
              typeId: typeId !== "all" ? typeId : undefined,
              category: category !== "all" ? category : undefined,
              status: status !== "all" ? status : undefined,
            }
          }
        }, {
          onSuccess: (blob) => {
            downloadBlob(blob, finalFilename);
            toast({ title: "Export downloaded successfully" });
          },
          onError: () => {
            toast({ title: "Export failed", variant: "destructive" });
          }
        });
      } else {
        // Use client side for CSV, JSON, TXT
        if (!propertiesList?.data) throw new Error("No data available");
        const blob = await generateClientExport(propertiesList.data, selectedColumns, exportFormat, encoding);
        downloadBlob(blob, finalFilename);
        toast({ title: "Export downloaded successfully" });
      }
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Preview data (first 5)
  const previewData = propertiesList?.data.slice(0, 5) || [];
  const activeCols = allColumns.filter(c => selectedColumns.includes(c.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Studio</h1>
        <p className="text-muted-foreground mt-1">
          Configure and extract your data for other platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Filters */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Selection</CardTitle>
              <CardDescription>Filter what to export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={regionId} onValueChange={setRegionId}>
                  <SelectTrigger><SelectValue placeholder="All Regions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions?.data.map(r => <SelectItem key={r.id} value={r.id} dir="auto">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types?.data.map(t => <SelectItem key={t.id} value={t.id} dir="auto">{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.data.map(c => <SelectItem key={c.value} value={c.value} dir="auto">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses?.data.map(s => <SelectItem key={s.value} value={s.value} dir="auto">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium">Matching records:</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-mono text-sm font-bold">
                  {propertiesList?.total || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Configuration */}
        <div className="lg:col-span-9 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Config section */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">1. Format</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
                        { id: 'csv', label: 'CSV', icon: FileText },
                        { id: 'json', label: 'JSON', icon: FileJson },
                        { id: 'txt', label: 'TXT', icon: FileText }
                      ].map(fmt => (
                        <div 
                          key={fmt.id}
                          className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${exportFormat === fmt.id ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'}`}
                          onClick={() => setExportFormat(fmt.id as any)}
                        >
                          <fmt.icon className="h-6 w-6 mb-2" />
                          <span className="text-xs font-medium uppercase">{fmt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {exportFormat === 'csv' && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Encoding (Important for Arabic)</Label>
                      <RadioGroup value={encoding} onValueChange={(v: any) => setEncoding(v)} className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="utf-8-bom" id="enc1" />
                          <Label htmlFor="enc1" className="font-normal cursor-pointer">UTF-8 with BOM (Best for Excel on Windows)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="utf-8" id="enc2" />
                          <Label htmlFor="enc2" className="font-normal cursor-pointer">Standard UTF-8 (Mac/Linux/Web)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">2. Filename</Label>
                    <div className="flex items-center">
                      <Input 
                        value={filename} 
                        onChange={(e) => setFilename(e.target.value)} 
                        className="rounded-r-none"
                      />
                      <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground text-sm font-mono">
                        .{exportFormat === 'excel' ? 'xlsx' : exportFormat}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-base shadow-lg" 
                    onClick={handleExport}
                    disabled={exportMutation.isPending || isLoadingProps || (propertiesList?.total === 0)}
                  >
                    {exportMutation.isPending ? "Generating Export..." : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Download {propertiesList?.total || 0} Records
                      </>
                    )}
                  </Button>
                </div>

                {/* Columns section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">3. Columns ({selectedColumns.length}/{allColumns.length})</Label>
                    <div className="text-xs space-x-2">
                      <button className="text-primary hover:underline" onClick={() => setSelectedColumns(allColumns.map(c => c.id))}>All</button>
                      <span className="text-muted-foreground">|</span>
                      <button className="text-primary hover:underline" onClick={() => setSelectedColumns([])}>None</button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden bg-card">
                    <div className="h-[300px] overflow-y-auto p-2 space-y-1">
                      {allColumns.map(col => (
                        <div key={col.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded group">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab" />
                          <Checkbox 
                            id={`col-${col.id}`} 
                            checked={selectedColumns.includes(col.id)}
                            onCheckedChange={() => toggleColumn(col.id)}
                          />
                          <Label htmlFor={`col-${col.id}`} className="flex-1 cursor-pointer flex items-center justify-between font-normal">
                            <span className="font-arabic" dir="auto">{col.label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{col.id}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Preview (First 5 rows)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {previewData.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground border-y">
                    <tr>
                      {activeCols.map(col => (
                        <th key={col.id} className="px-4 py-2 whitespace-nowrap font-arabic font-normal border-r last:border-0" dir="auto">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map(row => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                        {activeCols.map(col => (
                          <td key={col.id} className="px-4 py-2 whitespace-nowrap truncate max-w-[200px] border-r last:border-0 font-arabic" dir="auto">
                            {String((row as any)[col.id] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No matching properties found to preview.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}