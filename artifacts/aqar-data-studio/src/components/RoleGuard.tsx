import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";

export function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { profile } = useAuth();
  const role = profile?.role ?? "viewer";

  if (!roles.includes(role)) {
    return (
      <div className="min-h-[240px] flex flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="text-destructive" size={32} />
        <h2 className="font-semibold">لا تملك صلاحية الوصول</h2>
        <p className="text-sm text-muted-foreground">تواصل مع مدير النظام إذا كنت تحتاج إلى هذه الصفحة.</p>
      </div>
    );
  }

  return <>{children}</>;
}