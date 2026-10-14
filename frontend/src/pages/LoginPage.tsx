import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  LoaderCircle,
  LockKeyhole,
  Mail,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { isValidEmail } from "@/lib/auth-validation";
import { getRoleHomePath } from "@/lib/auth-navigation";
import { getApiErrorCode, getApiErrorMessage } from "@/services/auth";
import type { LoginInput } from "@/types/auth";

type LoginErrors = Partial<Record<keyof LoginInput | "form", string>>;

export function LoginPage() {
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<
    string | null
  >(null);
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user)
    return <Navigate to={getRoleHomePath(user.role)} replace />;

  const handleGoogleCredential = async (credential: string) => {
    setErrors({});
    setIsGoogleSubmitting(true);
    try {
      const authenticatedUser = await loginWithGoogle(credential);
      toast.success("Welcome back");
      navigate(getRoleHomePath(authenticatedUser.role), { replace: true });
    } catch (error) {
      if (getApiErrorCode(error) === "GOOGLE_ACCOUNT_LINK_REQUIRED") {
        setPendingGoogleCredential(credential);
        setErrors({
          form: "This email already has an account. Enter its password below to link Google securely.",
        });
      } else {
        const message = getApiErrorMessage(
          error,
          "Unable to sign in with Google.",
        );
        setErrors({ form: message });
        toast.error(message);
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

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
      const authenticatedUser = await login(
        {
          email: form.email.trim(),
          password: form.password,
        },
        pendingGoogleCredential ?? undefined,
      );
      toast.success("Welcome back");
      navigate(getRoleHomePath(authenticatedUser.role), { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to log in.");
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
            Discover amazing <span className="text-blue-400">events</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-blue-50/75">
            Explore, attend, and create events that bring people together.
            Find experiences that match your interests and make every
            gathering count.
          </p>

          <div className="mt-9 grid gap-5">
            <LoginBenefit
              icon={CalendarDays}
              title="Find events"
              description="Discover experiences chosen around your interests"
            />
            <LoginBenefit
              icon={UsersRound}
              title="Connect people"
              description="Meet communities that share what you care about"
            />
            <LoginBenefit
              icon={TicketCheck}
              title="Create opportunities"
              description="Learn, share, and grow through every event"
            />
          </div>
        </div>

        <div className="w-full max-w-[30rem] justify-self-center rounded-md border border-blue-300/35 bg-[#08132b]/80 p-4 shadow-[0_24px_80px_rgba(3,8,35,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6 lg:justify-self-end">
          <Link to="/" className="mb-7 inline-block lg:hidden">
            <BrandLogo className="h-10 w-48" />
          </Link>
          <h2 className="text-3xl font-bold tracking-normal text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-100/70">
            Sign in to manage your EventYatwon account.
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
            className="mx-auto mt-6 grid w-full max-w-[400px] gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <label className="grid gap-2 text-sm font-semibold text-white">
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-blue-300" /> Email
              </span>
              <div>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 border-blue-200/30 bg-[#050d20]/75 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
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
            <label className="grid gap-2 text-sm font-semibold text-white">
              <span className="flex items-center gap-2">
                <LockKeyhole className="size-4 text-blue-300" /> Password
              </span>
              <div>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="h-11 border-blue-200/30 bg-[#050d20]/75 pr-12 text-sm text-white shadow-none placeholder:text-blue-100/40 focus-visible:border-blue-400 focus-visible:ring-blue-400/25"
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
              {errors.password && (
                <span className="text-xs font-normal text-red-300">
                  {errors.password}
                </span>
              )}
            </label>
            <Button
              type="submit"
              className="h-11 bg-blue-500 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.32)] hover:bg-blue-400"
              disabled={disabled}
            >
              {isSubmitting && (
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
              )}
              {isSubmitting ? "Signing in" : "Log in"}
            </Button>
          </form>

          <div
            className="mx-auto my-5 flex w-full max-w-[400px] items-center gap-4"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-blue-200/20" />
            <span className="text-xs font-medium text-blue-100/55 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-blue-200/20" />
          </div>
          <GoogleAuthButton
            disabled={disabled}
            width={400}
            onCredential={handleGoogleCredential}
            onError={(message) => setErrors({ form: message })}
          />

          <p className="mt-5 text-center text-sm text-blue-100/65">
            New to EventYatwon?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function LoginBenefit({
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
