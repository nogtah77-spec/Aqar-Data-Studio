import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetProperty, 
  useCreateProperty, 
  useUpdateProperty, 
  useListRegions, 
  useListPropertyTypes,
  useListLookupOptions,
  getGetPropertyQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Building,
  MapPin,
  List,
  Maximize,
  Link as LinkIcon,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const propertySchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().optional(),
  area: z.coerce.number().optional(),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  floors: z.coerce.number().optional(),
  floor: z.coerce.number().optional(),
  finishing: z.string().optional(),
  view: z.string().optional(),
  typeId: z.string().optional(),
  regionId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  featured: z.boolean().default(false),
  unitType: z.string().optional(),
  subArea: z.string().optional(),
  location: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  mapsUrl: z.string().url().optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
  source: z.string().optional(),
  sourceNotes: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function PropertyForm() {
  const [, setLocation] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/properties/:id/edit");
  const isEdit = matchEdit && paramsEdit?.id && paramsEdit.id !== "new";
  const id = isEdit ? paramsEdit!.id : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("identity");

  // Queries
  const { data: property, isLoading: isPropertyLoading } = useGetProperty(id as string, { 
    query: { enabled: !!id, queryKey: getGetPropertyQueryKey(id as string) } 
  });
  const { data: regions } = useListRegions();
  const { data: propertyTypes } = useListPropertyTypes();
  const { data: statuses } = useListLookupOptions({ category: "status" });
  const { data: categories } = useListLookupOptions({ category: "category" });
  const { data: finishings } = useListLookupOptions({ category: "finishing" });
  const { data: unitTypes } = useListLookupOptions({ category: "unit_type" });

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      featured: false,
    },
  });

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && property && initializedForId.current !== id) {
      initializedForId.current = id as string;
      form.reset({
        code: property.code || "",
        title: property.title || "",
        description: property.description || "",
        price: property.price || undefined,
        area: property.area || undefined,
        beds: property.beds || undefined,
        baths: property.baths || undefined,
        floors: property.floors || undefined,
        floor: property.floor || undefined,
        finishing: property.finishing || "",
        view: property.view || "",
        typeId: property.typeId || "",
        regionId: property.regionId || "",
        category: property.category || "",
        status: property.status || "",
        featured: property.featured || false,
        unitType: property.unitType || "",
        subArea: property.subArea || "",
        location: property.location || "",
        videoUrl: property.videoUrl || "",
        mapsUrl: property.mapsUrl || "",
        externalUrl: property.externalUrl || "",
        source: property.source || "",
        sourceNotes: property.sourceNotes || "",
      });
    } else if (!isEdit && initializedForId.current !== "new") {
      initializedForId.current = "new";
      form.reset({
        code: `PRP-${Math.floor(Math.random() * 10000)}`,
        title: "",
        featured: false,
      });
    }
  }, [property, isEdit, id, form]);

  const onSubmit = (data: PropertyFormValues) => {
    if (isEdit && id) {
      updateProperty.mutate({ id, data }, {
        onSuccess: (updated) => {
          toast({ title: "Property updated successfully" });
          queryClient.setQueryData(getGetPropertyQueryKey(id), updated);
          setLocation("/properties");
        },
        onError: () => {
          toast({ title: "Failed to update property", variant: "destructive" });
        }
      });
    } else {
      createProperty.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Property created successfully" });
          setLocation("/properties");
        },
        onError: () => {
          toast({ title: "Failed to create property", variant: "destructive" });
        }
      });
    }
  };

  const generateCode = () => {
    form.setValue("code", `PRP-${Math.floor(Math.random() * 100000)}`);
  };

  const hasErrors = (fields: (keyof PropertyFormValues)[]) => {
    const errors = form.formState.errors;
    return fields.some(field => !!errors[field]);
  };

  if (isEdit && isPropertyLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-[600px] w-full rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/properties")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? "Edit Property" : "New Property"}
            </h1>
            {isEdit && property && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(property.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => form.handleSubmit(onSubmit)()}>
            Save as Draft
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={createProperty.isPending || updateProperty.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Update Property" : "Save Property"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-muted/50 p-1">
              <TabsTrigger value="identity" className="relative">
                <Building className="h-4 w-4 mr-2" /> Identity
                {hasErrors(["code", "title", "description"]) && (
                  <AlertCircle className="h-3 w-3 text-destructive absolute top-2 right-2" />
                )}
              </TabsTrigger>
              <TabsTrigger value="location" className="relative">
                <MapPin className="h-4 w-4 mr-2" /> Location
                {hasErrors(["regionId", "subArea", "location"]) && (
                  <AlertCircle className="h-3 w-3 text-destructive absolute top-2 right-2" />
                )}
              </TabsTrigger>
              <TabsTrigger value="classification" className="relative">
                <List className="h-4 w-4 mr-2" /> Classification
                {hasErrors(["typeId", "category", "status", "unitType"]) && (
                  <AlertCircle className="h-3 w-3 text-destructive absolute top-2 right-2" />
                )}
              </TabsTrigger>
              <TabsTrigger value="specifications" className="relative">
                <Maximize className="h-4 w-4 mr-2" /> Specifications
                {hasErrors(["price", "area", "beds", "baths", "finishing"]) && (
                  <AlertCircle className="h-3 w-3 text-destructive absolute top-2 right-2" />
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className="relative">
                <LinkIcon className="h-4 w-4 mr-2" /> Media & Source
                {hasErrors(["videoUrl", "mapsUrl", "externalUrl", "source"]) && (
                  <AlertCircle className="h-3 w-3 text-destructive absolute top-2 right-2" />
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="identity" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Identity</CardTitle>
                    <CardDescription>Core details that identify this property.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4 items-end">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Property Code *</FormLabel>
                            <FormControl>
                              <Input {...field} className="font-mono" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="secondary" onClick={generateCode}>Auto-Generate</Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Arabic) *</FormLabel>
                          <FormControl>
                            <Input {...field} dir="auto" className="font-arabic text-lg" placeholder="شقة فاخرة للبيع..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Arabic)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              dir="auto" 
                              className="font-arabic min-h-[150px] resize-y" 
                              placeholder="تفاصيل العقار..." 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Details</CardTitle>
                    <CardDescription>Where is this property located?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="regionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions?.map((region) => (
                                  <SelectItem key={region.id} value={region.id} dir="auto" className="font-arabic">
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sub Area / Neighborhood</FormLabel>
                            <FormControl>
                              <Input {...field} dir="auto" className="font-arabic" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Address</FormLabel>
                          <FormControl>
                            <Input {...field} dir="auto" className="font-arabic" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="classification" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Classification</CardTitle>
                    <CardDescription>How this property is categorized in the system.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="typeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="e.g. Apartment, Villa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {propertyTypes?.map((type) => (
                                  <SelectItem key={type.id} value={type.id} dir="auto" className="font-arabic">
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="e.g. Sale, Rent" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} dir="auto" className="font-arabic">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="e.g. Active, Sold" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {statuses?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} dir="auto" className="font-arabic">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="e.g. Residential, Commercial" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {unitTypes?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} dir="auto" className="font-arabic">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured Property</FormLabel>
                            <FormDescription>
                              Highlight this property on the dashboard and exports.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Specifications</CardTitle>
                    <CardDescription>Size, rooms, and physical attributes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area (sqm)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="beds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="baths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="floor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor Number</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="floors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Floors</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="finishing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Finishing</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select finishing" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {finishings?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} dir="auto" className="font-arabic">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Links & Media</CardTitle>
                    <CardDescription>External references and sources.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="mapsUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Maps URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://maps.google.com/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://youtube.com/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Source Information</CardTitle>
                    <CardDescription>Internal tracking details, hidden from public exports.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Name</FormLabel>
                            <FormControl>
                              <Input {...field} dir="auto" className="font-arabic" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sourceNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Notes</FormLabel>
                            <FormControl>
                              <Input {...field} dir="auto" className="font-arabic" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}