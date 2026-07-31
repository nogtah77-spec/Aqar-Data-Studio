import { useEffect, useState } from "react";
import {
  useCreateCustomer,
  useCreateCustomerTag,
  useDeleteCustomer,
  useDeleteCustomerTag,
  useListCustomerTags,
  useListCustomers,
  useUpdateCustomer,
} from "@workspace/api-client-react";
import type { Customer, CustomerInput, CustomerTag } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArchiveRestore,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

type CustomerForm = {
  fullName: string;
  customerType: CustomerInput["customerType"];
  customType: string;
  phone: string;
  whatsapp: string;
  email: string;
  companyName: string;
  jobTitle: string;
  notes: string;
  tagIds: string[];
};

const emptyForm: CustomerForm = {
  fullName: "",
  customerType: "buyer",
  customType: "",
  phone: "",
  whatsapp: "",
  email: "",
  companyName: "",
  jobTitle: "",
  notes: "",
  tagIds: [],
};

const customerTypeValues = ["owner", "buyer", "investor", "developer", "broker", "company", "custom"] as const;

function formatDate(value: string, language: "ar" | "en") {
  return new Date(value).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CustomerTypeLabel({ value, t }: { value: string; t: (key: any) => string }) {
  return <span>{t(`customers.type.${value}` as any)}</span>;
}

function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  tags,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  tags: CustomerTag[];
  onSaved: (form: CustomerForm, customer: Customer | null) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(customer ? {
      fullName: customer.fullName,
      customerType: customer.customerType,
      customType: customer.customType ?? "",
      phone: customer.phone ?? "",
      whatsapp: customer.whatsapp ?? "",
      email: customer.email ?? "",
      companyName: customer.companyName ?? "",
      jobTitle: customer.jobTitle ?? "",
      notes: customer.notes ?? "",
      tagIds: customer.tags.map((tag) => tag.id),
    } : emptyForm);
  }, [open, customer]);

  const update = (field: keyof CustomerForm, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="inherit">
        <DialogHeader>
          <DialogTitle>{customer ? t("customers.edit") : t("customers.new")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSaved(form, customer);
          }}
          data-testid="customer-form"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">{t("customers.fullName")} *</span>
              <Input
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                required
                autoFocus
                data-testid="customer-full-name"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.typeLabel")} *</span>
              <Select value={form.customerType} onValueChange={(value) => update("customerType", value)}>
                <SelectTrigger data-testid="customer-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customerTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      <CustomerTypeLabel value={value} t={t} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            {form.customerType === "custom" && (
              <label className="space-y-1.5">
                <span className="text-sm font-medium">{t("customers.customType")} *</span>
                <Input
                  value={form.customType}
                  onChange={(event) => update("customType", event.target.value)}
                  required
                  data-testid="customer-custom-type"
                />
              </label>
            )}
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.phone")}</span>
              <Input dir="ltr" value={form.phone} onChange={(event) => update("phone", event.target.value)} data-testid="customer-phone" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.whatsapp")}</span>
              <Input dir="ltr" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} data-testid="customer-whatsapp" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.email")}</span>
              <Input dir="ltr" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} data-testid="customer-email" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.company")}</span>
              <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} data-testid="customer-company" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t("customers.jobTitle")}</span>
              <Input value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} data-testid="customer-job-title" />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("customers.notes")}</span>
            <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} data-testid="customer-notes" />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("customers.tags")}</p>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">{t("customers.noTagsYet")}</span>
              ) : tags.map((tag) => {
                const selected = form.tagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => update("tagIds", selected ? form.tagIds.filter((id) => id !== tag.id) : [...form.tagIds, tag.id])}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    data-testid={`customer-tag-${tag.id}`}
                  >
                    {selected && <Check size={12} className="me-1 inline-block" />}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" data-testid="customer-save">{t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = profile?.role === "admin" || profile?.role === "agent";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [customerType, setCustomerType] = useState("all");
  const [tagId, setTagId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [tagName, setTagName] = useState("");

  const params = {
    page,
    limit: 20,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(status !== "all" ? { status: status as "active" | "archived" } : {}),
    ...(customerType !== "all" ? { customerType } : {}),
    ...(tagId !== "all" ? { tagId } : {}),
  };
  const { data, isLoading, isError, refetch } = useListCustomers(params, {
    query: { queryKey: ["customers", params] },
  });
  const { data: tags = [] } = useListCustomerTags({ query: { queryKey: ["customer-tags"] } });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const createTagMutation = useCreateCustomerTag();
  const deleteTagMutation = useDeleteCustomerTag();

  const activeCount = status === "active" ? data?.total ?? 0 : undefined;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["customer-tags"] });
  };

  const handleSaved = (form: CustomerForm, customer: Customer | null) => {
    const payload: CustomerInput = {
      fullName: form.fullName.trim(),
      customerType: form.customerType,
      customType: form.customType.trim() || undefined,
      phone: form.phone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      email: form.email.trim() || undefined,
      companyName: form.companyName.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      notes: form.notes.trim() || undefined,
      tagIds: form.tagIds,
    };
    const options = {
      onSuccess: () => {
        setDialogOpen(false);
        invalidate();
        toast({ title: customer ? t("customers.updated") : t("customers.created") });
      },
      onError: (error: Error) => toast({ title: t("customers.saveError"), description: error.message, variant: "destructive" }),
    };
    if (customer) {
      updateMutation.mutate({ id: customer.id, data: payload }, options);
    } else {
      createMutation.mutate({ data: payload }, options);
    }
  };

  const handleArchive = (customer: Customer) => {
    updateMutation.mutate(
      { id: customer.id, data: { status: customer.status === "archived" ? "active" : "archived" } },
      {
        onSuccess: () => { invalidate(); toast({ title: customer.status === "archived" ? t("customers.restored") : t("customers.archived") }); },
        onError: (error) => toast({ title: t("customers.saveError"), description: error.message, variant: "destructive" }),
      },
    );
  };

  const handleDelete = (customer: Customer) => {
    if (!window.confirm(t("customers.deleteConfirm"))) return;
    deleteMutation.mutate(
      { id: customer.id },
      {
        onSuccess: () => { invalidate(); toast({ title: t("customers.deleted") }); },
        onError: (error) => toast({ title: t("customers.deleteError"), description: error.message, variant: "destructive" }),
      },
    );
  };

  const addTag = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tagName.trim()) return;
    createTagMutation.mutate(
      { data: { name: tagName.trim() } },
      {
        onSuccess: () => { setTagName(""); invalidate(); toast({ title: t("customers.tagCreated") }); },
        onError: (error) => toast({ title: t("customers.tagError"), description: error.message, variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UsersRound size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("customers.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("customers.subtitle")}</p>
          </div>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => { setEditingCustomer(null); setDialogOpen(true); }} data-testid="new-customer">
            <Plus size={16} /> {t("customers.new")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><UsersRound className="text-primary" size={20} /><div><p className="text-xs text-muted-foreground">{t("customers.total")}</p><p className="text-xl font-bold">{data?.total ?? "—"}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><UserRound className="text-emerald-600" size={20} /><div><p className="text-xs text-muted-foreground">{t("customers.active")}</p><p className="text-xl font-bold">{activeCount ?? "—"}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Tag className="text-amber-600" size={20} /><div><p className="text-xs text-muted-foreground">{t("customers.tags")}</p><p className="text-xl font-bold">{tags.length}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t("customers.search")} data-testid="customers-search" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger data-testid="customers-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("customers.active")}</SelectItem>
              <SelectItem value="archived">{t("customers.archivedStatus")}</SelectItem>
              <SelectItem value="all">{t("customers.allStatuses")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerType} onValueChange={(value) => { setCustomerType(value); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder={t("customers.typeLabel")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("customers.allTypes")}</SelectItem>
              {customerTypeValues.map((value) => <SelectItem key={value} value={value}><CustomerTypeLabel value={value} t={t} /></SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tagId} onValueChange={(value) => { setTagId(value); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder={t("customers.tags")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("customers.allTags")}</SelectItem>
              {tags.map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{t("customers.directory")}</CardTitle>
          <span className="text-xs text-muted-foreground">{data?.total ?? 0} {t("customers.records")}</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.fullName")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.typeLabel")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.contact")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.tags")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.statusLabel")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("customers.lastUpdated")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("customers.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">{t("common.loading")}</td></tr>}
                {isError && !isLoading && <tr><td colSpan={7} className="py-10 text-center text-destructive">{t("customers.loadError")} <Button variant="link" onClick={() => refetch()}>{t("common.retry")}</Button></td></tr>}
                {!isLoading && !isError && data?.data.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/20">
                    <td className="min-w-[180px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound size={15} /></div>
                        <div><p className="font-medium">{customer.fullName}</p>{customer.companyName && <p className="text-xs text-muted-foreground">{customer.companyName}</p>}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><CustomerTypeLabel value={customer.customerType} t={t} />{customer.customType && <span className="ms-1 text-xs text-muted-foreground">({customer.customType})</span>}</td>
                    <td className="min-w-[170px] px-4 py-3 text-xs text-muted-foreground"><div className="space-y-1">{customer.phone && <p dir="ltr" className="flex items-center gap-1"><Phone size={12} />{customer.phone}</p>}{customer.email && <p dir="ltr" className="flex items-center gap-1"><Mail size={12} />{customer.email}</p>}</div></td>
                    <td className="max-w-[220px] px-4 py-3"><div className="flex flex-wrap gap-1">{customer.tags.map((tag) => <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>)}{customer.tags.length === 0 && <span className="text-xs text-muted-foreground">—</span>}</div></td>
                    <td className="px-4 py-3"><Badge variant={customer.status === "active" ? "success" : "outline"}>{customer.status === "active" ? t("customers.active") : t("customers.archivedStatus")}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDate(customer.updatedAt, language)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      {canEdit && <><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCustomer(customer); setDialogOpen(true); }} aria-label={t("customers.edit")}><Edit3 size={15} /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(customer)} aria-label={customer.status === "archived" ? t("customers.restore") : t("customers.archive")}><ArchiveRestore size={15} className={customer.status === "archived" ? "text-emerald-600" : "text-amber-600"} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(customer)} aria-label={t("customers.delete")}><Trash2 size={15} /></Button></>}
                    </div></td>
                  </tr>
                ))}
                {!isLoading && !isError && data?.data.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><UsersRound className="mx-auto mb-2 opacity-40" size={30} />{t("customers.empty")}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">{data?.totalPages ? `${data.page} / ${data.totalPages}` : ""}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronRight className="rtl:rotate-180 ltr:rotate-180" size={15} />{t("common.previous")}</Button>
              <Button variant="outline" size="sm" disabled={!data?.totalPages || page >= data.totalPages} onClick={() => setPage((current) => current + 1)}>{t("common.next")}<ChevronLeft className="rtl:rotate-180 ltr:rotate-180" size={15} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Tag size={17} />{t("customers.manageTags")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={addTag} className="flex max-w-md gap-2">
              <Input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder={t("customers.newTag")} data-testid="new-customer-tag" />
              <Button type="submit" disabled={!tagName.trim() || createTagMutation.isPending}><Plus size={15} />{t("customers.addTag")}</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => <span key={tag.id} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ borderColor: tag.color }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}<button type="button" onClick={() => { if (window.confirm(t("customers.deleteTagConfirm"))) deleteTagMutation.mutate({ id: tag.id }, { onSuccess: invalidate }); }} aria-label={t("customers.deleteTag")}><X size={12} /></button></span>)}
              {tags.length === 0 && <span className="text-sm text-muted-foreground">{t("customers.noTagsYet")}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editingCustomer} tags={tags} onSaved={handleSaved} />
      {isSaving && <span className="sr-only">{t("common.loading")}</span>}
    </div>
  );
}