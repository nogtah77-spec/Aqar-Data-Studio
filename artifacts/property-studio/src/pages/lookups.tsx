import { useState } from "react";
import { 
  useListRegions, 
  useCreateRegion, 
  useUpdateRegion, 
  useDeleteRegion,
  getListRegionsQueryKey,
  useListPropertyTypes,
  useCreatePropertyType,
  useUpdatePropertyType,
  useDeletePropertyType,
  getListPropertyTypesQueryKey,
  useListLookupOptions,
  useCreateLookupOption,
  useUpdateLookupOption,
  useDeleteLookupOption,
  getListLookupOptionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function RegionsTab() {
  const { data, isLoading } = useListRegions();
  const createRegion = useCreateRegion();
  const updateRegion = useUpdateRegion();
  const deleteRegion = useDeleteRegion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleCreate = () => {
    if (!newValue.trim()) return;
    const id = newValue.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    createRegion.mutate({ data: { id, name: newValue, active: true } }, {
      onSuccess: () => {
        toast({ title: "Region created" });
        queryClient.invalidateQueries({ queryKey: getListRegionsQueryKey() });
        setNewValue("");
        setIsAddOpen(false);
      }
    });
  };

  const handleUpdate = (id: string, name: string) => {
    if (!name.trim()) return;
    updateRegion.mutate({ id, data: { name } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRegionsQueryKey() });
        setEditingId(null);
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    updateRegion.mutate({ id, data: { active } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRegionsQueryKey() })
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteRegion.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRegionsQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Region
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Region</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Region Name (Arabic supported)" 
              dir="auto"
              value={newValue} 
              onChange={e => setNewValue(e.target.value)} 
              className="font-arabic"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRegion.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px] text-center">Properties</TableHead>
              <TableHead className="w-[100px] text-center">Active</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-10" /></TableCell></TableRow>
            ) : data?.map((region) => (
              <TableRow key={region.id}>
                <TableCell>
                  {editingId === region.id ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        className="h-8 font-arabic" 
                        dir="auto"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdate(region.id, editValue)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span dir="auto" className="font-arabic">{region.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                    {region.propertyCount || 0}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={region.active} 
                    onCheckedChange={(c) => handleToggle(region.id, c)} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(region.id); setEditValue(region.name); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(region.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TypesTab() {
  const { data, isLoading } = useListPropertyTypes();
  const createType = useCreatePropertyType();
  const updateType = useUpdatePropertyType();
  const deleteType = useDeletePropertyType();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleCreate = () => {
    if (!newValue.trim()) return;
    const id = newValue.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    createType.mutate({ data: { id, name: newValue, active: true } }, {
      onSuccess: () => {
        toast({ title: "Type created" });
        queryClient.invalidateQueries({ queryKey: getListPropertyTypesQueryKey() });
        setNewValue("");
        setIsAddOpen(false);
      }
    });
  };

  const handleUpdate = (id: string, name: string) => {
    if (!name.trim()) return;
    updateType.mutate({ id, data: { name } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPropertyTypesQueryKey() });
        setEditingId(null);
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    updateType.mutate({ id, data: { active } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPropertyTypesQueryKey() })
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteType.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPropertyTypesQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Type
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Type Name (Arabic supported)" 
              dir="auto"
              value={newValue} 
              onChange={e => setNewValue(e.target.value)} 
              className="font-arabic"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createType.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px] text-center">Properties</TableHead>
              <TableHead className="w-[100px] text-center">Active</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-10" /></TableCell></TableRow>
            ) : data?.map((type) => (
              <TableRow key={type.id}>
                <TableCell>
                  {editingId === type.id ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        className="h-8 font-arabic" 
                        dir="auto"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdate(type.id, editValue)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span dir="auto" className="font-arabic">{type.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                    {type.propertyCount || 0}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={type.active} 
                    onCheckedChange={(c) => handleToggle(type.id, c)} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(type.id); setEditValue(type.name); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(type.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LookupTab({ category }: { category: string }) {
  const { data, isLoading } = useListLookupOptions({ category });
  const createOption = useCreateLookupOption();
  const updateOption = useUpdateLookupOption();
  const deleteOption = useDeleteLookupOption();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    const value = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    createOption.mutate({ 
      data: { category, value, label: newLabel, active: true, sortOrder: 0 } 
    }, {
      onSuccess: () => {
        toast({ title: "Option created" });
        queryClient.invalidateQueries({ queryKey: getListLookupOptionsQueryKey({ category }) });
        setNewLabel("");
        setIsAddOpen(false);
      }
    });
  };

  const handleUpdate = (id: string, label: string) => {
    if (!label.trim()) return;
    updateOption.mutate({ id, data: { label } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLookupOptionsQueryKey({ category }) });
        setEditingId(null);
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    updateOption.mutate({ id, data: { active } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLookupOptionsQueryKey({ category }) })
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteOption.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLookupOptionsQueryKey({ category }) })
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Option
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Option</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Label (Arabic supported)" 
              dir="auto"
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)} 
              className="font-arabic"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createOption.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[150px]">Value (System)</TableHead>
              <TableHead className="w-[100px] text-center">Active</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-10" /></TableCell></TableRow>
            ) : data?.map((opt) => (
              <TableRow key={opt.id}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                </TableCell>
                <TableCell>
                  {editingId === opt.id ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editLabel} 
                        onChange={e => setEditLabel(e.target.value)} 
                        className="h-8 font-arabic" 
                        dir="auto"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdate(opt.id, editLabel)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span dir="auto" className="font-arabic">{opt.label}</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{opt.value}</TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={opt.active} 
                    onCheckedChange={(c) => handleToggle(opt.id, c)} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(opt.id); setEditLabel(opt.label); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(opt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Lookups() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reference Data</h1>
        <p className="text-muted-foreground mt-1">
          Manage dropdown options and lookup tables used across the platform.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="regions" className="w-full">
            <div className="border-b px-4 py-2 bg-muted/20">
              <TabsList className="bg-transparent h-auto p-0 gap-4 justify-start overflow-x-auto w-full">
                <TabsTrigger value="regions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Regions</TabsTrigger>
                <TabsTrigger value="types" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Property Types</TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Categories</TabsTrigger>
                <TabsTrigger value="statuses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Statuses</TabsTrigger>
                <TabsTrigger value="finishing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Finishing</TabsTrigger>
                <TabsTrigger value="unit_types" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">Unit Types</TabsTrigger>
              </TabsList>
            </div>
            <div className="p-6">
              <TabsContent value="regions" className="m-0"><RegionsTab /></TabsContent>
              <TabsContent value="types" className="m-0"><TypesTab /></TabsContent>
              <TabsContent value="categories" className="m-0"><LookupTab category="category" /></TabsContent>
              <TabsContent value="statuses" className="m-0"><LookupTab category="status" /></TabsContent>
              <TabsContent value="finishing" className="m-0"><LookupTab category="finishing" /></TabsContent>
              <TabsContent value="unit_types" className="m-0"><LookupTab category="unit_type" /></TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}