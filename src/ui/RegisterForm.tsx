"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { Button, Input, Label, Card } from "@/src/ui/primitives";

type EmailRow = { address: string; isPrimary: boolean };
type PhoneRow = { countryCode: string; number: string; isPrimary: boolean };

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s; // 0..4
}

const SectionHeader = ({ n, title }: { n: string; title: string }) => (
  <div className="mb-4 flex items-baseline gap-2.5">
    <span className="font-mono text-[11px] font-medium text-accent">{n}</span>
    <h2 className="text-[15px] font-semibold text-text">{title}</h2>
  </div>
);

export function RegisterForm() {
  const t = useTranslations("register");
  const em = useErrorMessage();
  const router = useRouter();
  const { register } = useAuth();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emails, setEmails] = useState<EmailRow[]>([{ address: "", isPrimary: true }]);
  const [phones, setPhones] = useState<PhoneRow[]>([
    { countryCode: "+44", number: "", isPrimary: true },
  ]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirm;

  function setEmailPrimary(i: number) {
    setEmails((rows) => rows.map((r, idx) => ({ ...r, isPrimary: idx === i })));
  }
  function setPhonePrimary(i: number) {
    setPhones((rows) => rows.map((r, idx) => ({ ...r, isPrimary: idx === i })));
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("imageExceedsLimit"));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await api<{ url: string }>("/uploads", { method: "POST", body: fd, auth: false });
      setAvatarUrl(url);
    } catch (err) {
      toast.error(em(err, t("uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error(t("passwordsDoNotMatch"));
      return;
    }
    const primaryEmail =
      (emails.find((e) => e.isPrimary) ?? emails[0])?.address.trim() || "";
    setSubmitting(true);
    try {
      await register({
        firstName,
        lastName,
        password,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        country: country || undefined,
        address: address || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        emails: emails.filter((e) => e.address.trim()),
        phones: phones.filter((p) => p.number.trim()),
      });
      // No session is started — prompt the user to verify their email, then sign in.
      setRegisteredEmail(primaryEmail);
    } catch (err) {
      setSubmitting(false);
      toast.error(em(err, t("registerError")));
    }
  }

  if (registeredEmail) {
    return (
      <Card className="my-8 w-full max-w-md p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-text">{t("checkEmailTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-2">
          {t("checkEmailBody", { email: registeredEmail })}
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
          {t("goToSignIn")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="my-8 w-full max-w-2xl p-7 shadow-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
      <p className="mt-1 text-[13.5px] text-text-2">
        {t("alreadyMember")}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("signIn")}
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* 01 basic */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="01" title={t("section01")} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="dob">{t("dateOfBirth")}</Label>
              <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gender">{t("gender")}</Label>
              <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder={t("optional")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 02 photo */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="02" title={t("section02")} />
          <div className="flex items-center gap-4">
            <span
              className="h-16 w-16 flex-none overflow-hidden rounded-full border border-border bg-surface-3"
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: "cover" } : undefined}
            />
            <label className="cursor-pointer rounded-lg border border-dashed border-border-strong px-4 py-3 text-sm text-text-2 hover:border-accent hover:bg-accent-soft">
              {uploading ? t("uploading") : avatarUrl ? t("changePhoto") : t("uploadPhoto")}
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* 03 phones */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="03" title={t("section03")} />
          <div className="space-y-2.5">
            {phones.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={p.countryCode}
                  onChange={(e) =>
                    setPhones((rows) => rows.map((r, idx) => (idx === i ? { ...r, countryCode: e.target.value } : r)))
                  }
                  className="w-20"
                  aria-label={t("countryCode")}
                />
                <Input
                  value={p.number}
                  onChange={(e) =>
                    setPhones((rows) => rows.map((r, idx) => (idx === i ? { ...r, number: e.target.value } : r)))
                  }
                  placeholder={t("phoneNumber")}
                  className="flex-1"
                  aria-label={t("phoneNumber")}
                />
                <button
                  type="button"
                  onClick={() => setPhonePrimary(i)}
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${p.isPrimary ? "border-accent-line bg-accent-soft text-accent" : "border-border-strong text-text-3 hover:text-text-2"}`}
                >
                  {p.isPrimary ? t("primary") : t("setPrimary")}
                </button>
                {phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPhones((rows) => rows.filter((_, idx) => idx !== i))}
                    className="h-9 w-9 flex-none rounded-lg border border-border-strong text-text-3 hover:border-danger hover:text-danger"
                    aria-label={t("removePhone")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPhones((rows) => [...rows, { countryCode: "+44", number: "", isPrimary: false }])}
              className="rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft"
            >
              {t("addPhone")}
            </button>
          </div>
        </div>

        {/* 04 emails */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="04" title={t("section04")} />
          <div className="space-y-2.5">
            {emails.map((em, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="email"
                  value={em.address}
                  onChange={(e) =>
                    setEmails((rows) => rows.map((r, idx) => (idx === i ? { ...r, address: e.target.value } : r)))
                  }
                  placeholder={t("emailPlaceholder")}
                  className="flex-1"
                  required={i === 0}
                  aria-label={t("emailAddress")}
                />
                <button
                  type="button"
                  onClick={() => setEmailPrimary(i)}
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${em.isPrimary ? "border-accent-line bg-accent-soft text-accent" : "border-border-strong text-text-3 hover:text-text-2"}`}
                >
                  {em.isPrimary ? t("primary") : t("setPrimary")}
                </button>
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEmails((rows) => rows.filter((_, idx) => idx !== i))}
                    className="h-9 w-9 flex-none rounded-lg border border-border-strong text-text-3 hover:border-danger hover:text-danger"
                    aria-label={t("removeEmail")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEmails((rows) => [...rows, { address: "", isPrimary: false }])}
              className="rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft"
            >
              {t("addEmail")}
            </button>
          </div>
        </div>

        {/* 05 security */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="05" title={t("section05")} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="mt-2 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < score ? (score >= 3 ? "bg-success" : "bg-warning") : "bg-surface-3"}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">{t("confirmPassword")}</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                invalid={confirm.length > 0 && !passwordsMatch}
                required
              />
              {confirm.length > 0 && (
                <p className={`mt-1.5 text-xs ${passwordsMatch ? "text-success" : "text-danger"}`}>
                  {passwordsMatch ? t("passwordsMatch") : t("passwordsDoNotMatch")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 06 bio */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <SectionHeader n="06" title={t("section06")} />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            className="h-20 w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            placeholder={t("bioPlaceholder")}
          />
          <div className="mt-1 text-end text-[11px] text-text-3">{bio.length} / 280</div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" loading={submitting}>
            {t("createAccount")}
          </Button>
          <span className="ms-auto text-xs text-text-3">{t("terms")}</span>
        </div>
      </form>
    </Card>
  );
}
