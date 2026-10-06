import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  getSupportError,
  submitSupportRequest,
  type SupportTopic,
} from "@/services/support";

const emailPattern = /^\S+@\S+\.\S+$/;

export function ContactSupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [topic, setTopic] = useState<SupportTopic>("registration");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const supportMutation = useMutation({
    mutationFn: submitSupportRequest,
  });

  const nameValue = name ?? user?.name ?? "";
  const emailValue = email ?? user?.email ?? "";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = {
      name: nameValue.trim(),
      email: emailValue.trim(),
      topic,
      message: message.trim(),
    };
    if (input.name.length < 2) {
      setValidationError("Enter your name.");
      return;
    }
    if (!emailPattern.test(input.email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (input.message.length < 10) {
      setValidationError("Tell us a little more about what happened.");
      return;
    }
    setValidationError("");
    supportMutation.mutate(input);
  };

  const reset = () => {
    supportMutation.reset();
    setTopic("registration");
    setMessage("");
    setValidationError("");
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-3xl">
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <MessageSquareText className="size-4" /> Contact support
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Tell us where you are stuck.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">
          Share the details of your registration, ticket, account, or event
          issue with the EventYatwon team.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="bg-card rounded-lg border p-5 sm:p-8">
          {supportMutation.isSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto size-11 text-emerald-500" />
              <h2 className="mt-5 text-2xl font-semibold">Request received</h2>
              <p className="text-muted-foreground mx-auto mt-3 max-w-lg leading-7">
                Your support request was saved and EventYatwon administrators
                were notified.
              </p>
              <Button className="mt-6" variant="outline" onClick={reset}>
                Send another request
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 className="text-2xl font-semibold">Support request</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="support-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <Input
                    id="support-name"
                    value={nameValue}
                    maxLength={100}
                    autoComplete="name"
                    className="h-11"
                    disabled={supportMutation.isPending}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="support-email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email address
                  </label>
                  <Input
                    id="support-email"
                    type="email"
                    value={emailValue}
                    maxLength={254}
                    autoComplete="email"
                    className="h-11"
                    disabled={supportMutation.isPending}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="support-topic"
                  className="mb-2 block text-sm font-medium"
                >
                  What do you need help with?
                </label>
                <select
                  id="support-topic"
                  value={topic}
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-3"
                  disabled={supportMutation.isPending}
                  onChange={(event) =>
                    setTopic(event.target.value as SupportTopic)
                  }
                >
                  <option value="registration">Registration</option>
                  <option value="tickets">Tickets and check-in</option>
                  <option value="account">Account</option>
                  <option value="events">Event management</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="support-message"
                  className="mb-2 block text-sm font-medium"
                >
                  Message
                </label>
                <textarea
                  id="support-message"
                  value={message}
                  rows={7}
                  maxLength={2000}
                  placeholder="Include the event name, what you tried, and any error message you saw."
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 w-full resize-y rounded-lg border px-3 py-3 text-sm leading-6 outline-none focus:ring-3"
                  disabled={supportMutation.isPending}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <p className="text-muted-foreground mt-1 text-right text-xs">
                  {message.length}/2000
                </p>
              </div>

              {(validationError || supportMutation.isError) && (
                <p className="text-destructive mt-4 text-sm" role="alert">
                  {validationError || getSupportError(supportMutation.error)}
                </p>
              )}

              <Button
                type="submit"
                className="mt-6 h-11 px-5"
                disabled={supportMutation.isPending}
              >
                {supportMutation.isPending && (
                  <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                )}
                {supportMutation.isPending ? "Sending" : "Send request"}
              </Button>
            </form>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-lg border p-5">
            <CircleHelp className="text-primary size-5" />
            <h2 className="mt-4 font-semibold">Check the help center</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Common registration and ticket questions may already have a quick
              answer.
            </p>
            <Link
              to="/help"
              className="text-primary mt-4 inline-block text-sm font-semibold hover:underline"
            >
              Browse help topics
            </Link>
          </section>
          <section className="rounded-lg border p-5">
            <ShieldCheck className="text-primary size-5" />
            <h2 className="mt-4 font-semibold">Keep private details private</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Never include your password or full QR token in a support request.
            </p>
          </section>
          <section className="rounded-lg border p-5">
            <Mail className="text-primary size-5" />
            <h2 className="mt-4 font-semibold">Organizer questions</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              For event-specific details, use the organizer contact shown on
              that event page.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
