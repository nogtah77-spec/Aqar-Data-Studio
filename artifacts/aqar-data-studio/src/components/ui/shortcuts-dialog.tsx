import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "البحث الشامل" },
  { keys: ["⌘", "N"], label: "إضافة عقار جديد" },
  { keys: ["/"],       label: "البحث الشامل" },
  { keys: ["?"],       label: "عرض اختصارات لوحة المفاتيح" },
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("aqar:shortcuts-help", handler);
    return () => window.removeEventListener("aqar:shortcuts-help", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختصارات لوحة المفاتيح</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">اضغط <span className="font-mono">?</span> في أي وقت لعرض هذه النافذة</p>
      </DialogContent>
    </Dialog>
  );
}
