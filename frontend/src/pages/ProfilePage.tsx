import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  getApiErrorMessage,
  removeAvatar,
  replaceAvatar,
  updateProfile,
} from "@/services/auth";

const emailPattern = /^\S+@\S+\.\S+$/;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [profileError, setProfileError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chooseImage = (image?: File) => {
    setImageError("");
    if (!image) return;
    if (!image.type.startsWith("image/")) {
      setImageError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      setImageError("Profile image must be 5 MB or smaller.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(image);
    setPreview(URL.createObjectURL(image));
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim();
    if (nextName.length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }
    if (!emailPattern.test(nextEmail)) {
      setProfileError("Enter a valid email address.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    try {
      await updateProfile({ name: nextName, email: nextEmail });
      await refreshUser();
      setName(nextName);
      setEmail(nextEmail);
      toast.success("Profile updated");
    } catch (error) {
      setProfileError(
        getApiErrorMessage(error, "Profile information could not be updated."),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveImage = async () => {
    if (!file) return;
    setIsSavingImage(true);
    setImageError("");
    try {
      await replaceAvatar(file);
      await refreshUser();
      clearSelection();
      toast.success("Profile image updated");
    } catch (error) {
      setImageError(
        getApiErrorMessage(error, "Profile image could not be updated."),
      );
    } finally {
      setIsSavingImage(false);
    }
  };

  const removeImage = async () => {
    if (!window.confirm("Remove your profile image?")) return;
    setIsSavingImage(true);
    setImageError("");
    try {
      await removeAvatar();
      await refreshUser();
      clearSelection();
      toast.success("Profile image removed");
    } catch (error) {
      setImageError(
        getApiErrorMessage(error, "Profile image could not be removed."),
      );
    } finally {
      setIsSavingImage(false);
    }
  };

  const hasProfileChanges =
    name.trim() !== user?.name || email.trim() !== user?.email;
  const initials = (user?.name ?? "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Account settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Your profile
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6 sm:text-base">
            Keep your public identity and contact email up to date. This
            information appears on registrations, tickets, and reviews.
          </p>
        </div>
        <div className="bg-secondary flex w-fit shrink-0 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium capitalize">
          <ShieldCheck className="text-primary size-4" />
          {user?.role}
        </div>
      </header>

      <div className="mt-8 space-y-6">
        <section
          className="bg-card w-full rounded-lg border p-5 sm:p-8"
          aria-labelledby="photo-heading"
        >
          <div className="grid items-center gap-7 md:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <h2 id="photo-heading" className="text-lg font-semibold">
                  Profile image
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Max 5 MB. Recommended size: 400 x 400 px.
                </p>
              </div>
            </div>

            <div className="group relative mx-auto size-36 sm:size-40 md:mx-0 md:justify-self-end">
              <div className="bg-muted size-full overflow-hidden rounded-full border">
                {preview || user?.avatar ? (
                  <img
                    src={preview || user?.avatar || undefined}
                    alt={`${user?.name ?? "User"} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-primary grid size-full place-items-center text-4xl font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute inset-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Choose profile image"
                disabled={isSavingImage}
                onClick={() => fileInputRef.current?.click()}
              />
              <div className="bg-background pointer-events-none absolute right-0 bottom-1 grid size-10 place-items-center rounded-full border shadow-sm">
                <Camera className="size-4" />
              </div>
              {(preview || user?.avatar) && (
                <button
                  type="button"
                  className="bg-destructive text-destructive-foreground absolute top-1 right-1 z-10 grid size-10 place-items-center rounded-full opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={preview ? "Clear selected image" : "Remove profile image"}
                  disabled={isSavingImage}
                  onClick={preview ? clearSelection : removeImage}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 md:col-span-2 md:w-72 md:justify-self-end">
              <Input
                ref={fileInputRef}
                id="avatar-image"
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                disabled={isSavingImage}
                onChange={(event) => chooseImage(event.target.files?.[0])}
              />
              {file ? (
                <>
                  <div className="bg-muted/60 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs">
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      aria-label="Clear selected image"
                      onClick={clearSelection}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <Button disabled={isSavingImage} onClick={saveImage}>
                    {isSavingImage && (
                      <LoaderCircle className="size-4 animate-spin" />
                    )}
                    {isSavingImage ? "Uploading" : "Save image"}
                  </Button>
                </>
              ) : null}

              {imageError && (
                <p className="text-destructive text-sm" role="alert">
                  {imageError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="bg-card rounded-lg border p-5 sm:p-8"
          aria-labelledby="details-heading"
        >
          <div className="flex items-start gap-3 border-b pb-5">
            <div className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
              <UserRound className="size-5" />
            </div>
            <div>
              <h2 id="details-heading" className="text-lg font-semibold">
                Personal information
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                This name appears on registrations, tickets, and reviews.
              </p>
            </div>
          </div>

          <form className="mt-6" onSubmit={saveProfile}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <div className="relative">
                  <UserRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="profile-name"
                    value={name}
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    className="h-12 pl-10"
                    disabled={isSavingProfile}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    maxLength={254}
                    autoComplete="email"
                    className="h-12 pl-10"
                    disabled={isSavingProfile}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="bg-muted/35 flex items-center gap-3 rounded-lg border px-4 py-4">
                <ShieldCheck className="text-primary size-5 shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Account type
                  </dt>
                  <dd className="mt-1 text-sm font-semibold capitalize">
                    {user?.role}
                  </dd>
                </div>
              </div>
              <div className="bg-muted/35 flex items-center gap-3 rounded-lg border px-4 py-4">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Account status
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">Active</dd>
                </div>
              </div>
            </dl>

            {profileError && (
              <p className="text-destructive mt-4 text-sm" role="alert">
                {profileError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={!hasProfileChanges || isSavingProfile}
                onClick={() => {
                  setName(user?.name ?? "");
                  setEmail(user?.email ?? "");
                  setProfileError("");
                }}
              >
                Discard changes
              </Button>
              <Button
                type="submit"
                disabled={!hasProfileChanges || isSavingProfile}
              >
                {isSavingProfile && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                {isSavingProfile ? "Saving" : "Save changes"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
