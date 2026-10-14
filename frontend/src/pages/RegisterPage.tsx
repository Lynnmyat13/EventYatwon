import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CalendarPlus,
  LoaderCircle,
  LockKeyhole,
  Mail,
  TicketCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { BrandLogo } from "@/components/BrandLogo";
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { loginWithGoogle, register, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user)
    return <Navigate to={getRoleHomePath(user.role)} replace />;

  const handleGoogleCredential = async (credential: string) => {
    setErrors({});
    setIsGoogleSubmitting(true);
    try {
      const registeredUser = await loginWithGoogle(credential);
      toast.success("Account created");
      navigate(getRoleHomePath(registeredUser.role), { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to continue with Google.",
      );
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

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

  const disabled = isLoading || isSubmitting || isGoogleSubmitting;

  return (
    <section className="fixed inset-0 z-50 overflow-y-auto bg-[#050817] text-white">
      <img
        src="/Register_bg.png"
        alt="Event audience watching a live presentation"
        className="fixed inset-0 size-full object-cover object-center"
      />
      <div className="fixed inset-0 bg-[#030617]/55" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-7xl items-center gap-10 px-3 sm:px-8 lg:grid-cols-[1fr_30rem] lg:px-12">
        <div className="hidden max-w-xl lg:block">
          <Link to="/" className="inline-flex flex-col">
            <BrandLogo className="h-12 w-56" />
            <span className="mt-1 pl-3 text-[0.68rem] font-medium tracking-[0.28em] text-blue-100/75 uppercase">
              Events · People · Opportunities
            </span>
          </Link>

          <h1 className="mt-16 max-w-lg text-6xl leading-[1.04] font-bold tracking-normal text-balance">
            Turn moments into <span className="text-blue-400">memories</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-blue-50/75">
            Join EventYatwon to discover gatherings, meet new communities, or
            bring your own event to life.
          </p>

          <div className="mt-9 grid gap-5">
            <RegisterBenefit
              icon={CalendarDays}
              title="Discover events"
              description="Find experiences chosen around your interests"
            />
            <RegisterBenefit
              icon={UsersRound}
              title="Meet your community"
              description="Connect with people who share what you care about"
            />
            <RegisterBenefit
              icon={TicketCheck}
              title="Keep every ticket close"
              description="Register and access your event passes from one place"
            />
          </div>
        </div>

        <div className="w-full max-w-[30rem] justify-self-center rounded-md border border-blue-300/35 bg-[#08132b]/80 p-4 shadow-[0_24px_80px_rgba(3,8,35,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5 lg:justify-self-end">
          <Link to="/" className="mb-4 inline-block lg:hidden">
            <BrandLogo className="h-10 w-48" />
          </Link>
          <h2 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-100/70">
            Fill in your details to join EventYatwon.
          </p>

          {errors.form && (
            <p
              className="mt-5 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
              role="alert"
            >
              {errors.form}
            </p>
          )}

          <form
            className="mx-auto mt-4 grid w-full max-w-[400px] gap-3"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <UserRound className="size-4 text-blue-300" /> Full name
                </span>
                <div>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-10 border-blue-200/30 bg-[#050d20]/75 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(errors.name)}
                    disabled={disabled}
                  />
                </div>
                {errors.name && (
                  <span className="text-xs font-normal text-red-300">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <Mail className="size-4 text-blue-300" /> Email
                </span>
                <div>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-10 border-blue-200/30 bg-[#050d20]/75 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
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
                </div>
                {errors.email && (
                  <span className="text-xs font-normal text-red-300">
                    {errors.email}
                  </span>
                )}
              </label>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-blue-300" /> Password
                </span>
                <div>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className="h-10 border-blue-200/30 bg-[#050d20]/75 pr-12 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
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
                </div>
                {errors.password ? (
                  <span className="text-xs font-normal text-red-300">
                    {errors.password}
                  </span>
                ) : (
                  <span className="text-xs font-normal text-blue-100/55">
                    8-72 bytes, uppercase, lowercase, and a number.
                  </span>
                )}
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-blue-300" /> Confirm
                  password
                </span>
                <div>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Enter it again"
                    className="h-10 border-blue-200/30 bg-[#050d20]/75 pr-12 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
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
                </div>
                {errors.confirmPassword && (
                  <span className="text-xs font-normal text-red-300">
                    {errors.confirmPassword}
                  </span>
                )}
              </label>
            </div>

            <fieldset className="grid gap-1.5" disabled={disabled}>
              <legend className="flex items-center gap-2 text-sm font-semibold text-white">
                <UsersRound className="size-4 text-blue-300" /> Account type
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
                          ? "cursor-pointer rounded-md border border-blue-400 bg-blue-500/15 p-2.5 transition-colors"
                          : "cursor-pointer rounded-md border border-blue-200/20 bg-[#050d20]/55 p-2.5 transition-colors hover:border-blue-300/45 hover:bg-blue-500/10"
                      }
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selected}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            role: role.value,
                          }))
                        }
                        className="sr-only"
                      />
                      <span className="flex items-start gap-3">
                        <Icon
                          className="mt-0.5 size-5 shrink-0 text-blue-300"
                          strokeWidth={1.8}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-white">
                            {role.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-blue-100/55">
                            {role.description}
                          </span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <Button
              type="submit"
              className="mx-auto h-10 w-full max-w-[400px] bg-blue-500 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.32)] hover:bg-blue-400"
              disabled={disabled}
            >
              {isSubmitting && (
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
              )}
              {isSubmitting ? "Creating account" : "Create account"}
            </Button>
          </form>

          <div
            className="mx-auto my-3 flex w-full max-w-[400px] items-center gap-4"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-blue-200/20" />
            <span className="text-xs font-medium text-blue-100/55 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-blue-200/20" />
          </div>
          <div className="mx-auto w-full max-w-[400px]">
            <GoogleAuthButton
              disabled={disabled}
              width={400}
              onCredential={handleGoogleCredential}
              onError={(message) => setErrors({ form: message })}
            />
            <p className="mt-1 text-center text-xs text-blue-100/55">
              Google accounts are created as attendee accounts.
            </p>
          </div>
          <p className="mt-3 text-center text-sm text-blue-100/65">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function RegisterBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-blue-400/25 bg-blue-500/15 text-blue-300">
        <Icon className="size-6" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-base font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-sm text-blue-100/65">
          {description}
        </span>
      </span>
    </div>
  );
}
