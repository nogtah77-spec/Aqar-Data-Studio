import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Login() {
  const { signIn } = useAuth();
  const { t, language, dir } = useLanguage();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      // Translate common Supabase error messages without exposing provider details.
      const msg =
        error.includes("Invalid login credentials")
          ? t("login.invalidCredentials")
          : error.includes("Email not confirmed")
          ? t("login.emailNotConfirmed")
          : error.includes("Too many requests")
          ? t("login.tooManyRequests")
          : t("login.genericError");
      setError(msg);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#F5EFEB] dark:bg-[#1a2332] flex items-center justify-center p-4"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#C8D9E6]/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#567C8D]/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo & branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2F4156] shadow-lg mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2F4156] dark:text-white tracking-tight">
            Aqar Data Studio
          </h1>
          <p className="text-sm text-[#567C8D] dark:text-[#C8D9E6] mt-1">
             {t("login.tagline")}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-[#1e2d40] rounded-2xl shadow-xl border border-[#C8D9E6]/50 dark:border-[#2F4156] p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
             {t("login.title")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                 {t("login.email")}
              </Label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-9 text-right"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                   {t("login.password")}
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-9 text-right"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                   aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className={cn(
                "w-full font-semibold h-11",
                "bg-[#2F4156] hover:bg-[#243349] text-white",
                "dark:bg-[#567C8D] dark:hover:bg-[#4a6d7c]"
              )}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="ms-2 animate-spin" />
                   {t("login.loading")}
                </>
              ) : (
                 t("login.submit")
              )}
            </Button>
          </form>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
           {t("login.help")}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Aqar Data Studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
