import { useState, type FormEvent } from "react";
import { CalendarPlus, LoaderCircle, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getPasswordError, isValidEmail } from "@/lib/auth-validation";
import { getRoleHomePath } from "@/lib/auth-navigation";
import { getApiErrorMessage } from "@/services/auth";
import type { PublicRegistrationRole, RegisterInput } from "@/types/auth";

interface RegisterForm extends RegisterInput {
  confirmPassword: string;
}

type RegisterErrors = Partial<Record<keyof RegisterForm | "form", string>>;

const roles: Array<{
  value: PublicRegistrationRole;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    value: "attendee",
    label: "Attendee",
    description: "Discover and join events",
    icon: UserRound,
  },
  {
    value: "organizer",
    label: "Organizer",
    description: "Create and manage events",
    icon: CalendarPlus,
  },
];

export function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "attendee",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user)
    return <Navigate to={getRoleHomePath(user.role)} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: RegisterErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const passwordError = getPasswordError(form.password);

    if (name.length < 2 || name.length > 100)
      nextErrors.name = "Use between 2 and 100 characters.";
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (passwordError) nextErrors.password = passwordError;
    if (form.confirmPassword !== form.password)
      nextErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const registeredUser = await register({
        name,
        email,
        password: form.password,
        role: form.role,
      });
      toast.success("Account created");
      navigate(getRoleHomePath(registeredUser.role), { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to create your account.",
      );
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <section className="mx-auto flex min-h-[68dvh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-card w-full max-w-lg rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="text-card-foreground text-3xl font-semibold tracking-normal">
          Create your account
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Join EventYatwon as an attendee or organizer.
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
            Name
            <Input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              aria-invalid={Boolean(errors.name)}
              disabled={disabled}
            />
            {errors.name && (
              <span className="text-destructive text-xs">{errors.name}</span>
            )}
          </label>
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
              autoComplete="new-password"
              placeholder="Create a password"
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
            {errors.password ? (
              <span className="text-destructive text-xs">
                {errors.password}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                8-72 bytes with uppercase, lowercase, and a number.
              </span>
            )}
          </label>
          <label className="text-card-foreground grid gap-2 text-sm font-medium">
            Confirm password
            <PasswordInput
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.confirmPassword)}
              disabled={disabled}
            />
            {errors.confirmPassword && (
              <span className="text-destructive text-xs">
                {errors.confirmPassword}
              </span>
            )}
          </label>

          <fieldset className="grid gap-2" disabled={disabled}>
            <legend className="text-card-foreground text-sm font-medium">
              Account type
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const selected = form.role === role.value;

                return (
                  <label
                    key={role.value}
                    className={
                      selected
                        ? "border-primary bg-primary/8 cursor-pointer rounded-lg border p-3"
                        : "bg-background hover:bg-muted/60 cursor-pointer rounded-lg border p-3"
                    }
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selected}
                      onChange={() =>
                        setForm((current) => ({ ...current, role: role.value }))
                      }
                      className="sr-only"
                    />
                    <span className="flex items-start gap-3">
                      <Icon
                        className="text-primary mt-0.5 size-5 shrink-0"
                        strokeWidth={1.8}
                      />
                      <span>
                        <span className="text-card-foreground block text-sm font-semibold">
                          {role.label}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs leading-5">
                          {role.description}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Button type="submit" className="h-11" disabled={disabled}>
            {isSubmitting && (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {isSubmitting ? "Creating account" : "Create account"}
          </Button>
        </form>
        <p className="text-muted-foreground mt-6 text-sm">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
