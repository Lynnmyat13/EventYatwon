import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { isValidEmail } from "@/lib/auth-validation";
import { getApiErrorMessage } from "@/services/auth";
import type { LoginInput } from "@/types/auth";

type LoginErrors = Partial<Record<keyof LoginInput | "form", string>>;

export function LoginPage() {
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: LoginErrors = {};

    if (!isValidEmail(form.email.trim()))
      nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Enter your password.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Welcome back");
      navigate("/", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to log in.");
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <section className="mx-auto flex min-h-[68dvh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-card w-full max-w-md rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="text-card-foreground text-3xl font-semibold tracking-normal">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Sign in to manage your EventYatwon account.
        </p>

        {errors.form && (
          <p
            className="bg-destructive/10 text-destructive mt-5 rounded-lg px-3 py-2 text-sm"
            role="alert"
          >
            {errors.form}
          </p>
        )}

        <form className="mt-7 grid gap-5" onSubmit={handleSubmit} noValidate>
          <label className="text-card-foreground grid gap-2 text-sm font-medium">
            Email
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.email)}
              disabled={disabled}
            />
            {errors.email && (
              <span className="text-destructive text-xs">{errors.email}</span>
            )}
          </label>
          <label className="text-card-foreground grid gap-2 text-sm font-medium">
            Password
            <PasswordInput
              autoComplete="current-password"
              placeholder="Your password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.password)}
              disabled={disabled}
            />
            {errors.password && (
              <span className="text-destructive text-xs">
                {errors.password}
              </span>
            )}
          </label>
          <Button type="submit" className="h-11" disabled={disabled}>
            {isSubmitting && (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {isSubmitting ? "Signing in" : "Log in"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-sm">
          New to EventYatwon?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
