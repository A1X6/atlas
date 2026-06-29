"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/src/lib/auth";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import type { UserProfile, PhoneDTO, EmailDTO } from "@/src/lib/types";
import { Button, Card, Input, Label, RoleBadge, Spinner } from "@/src/ui/primitives";

type EmailRow = { address: string; isPrimary: boolean; verified?: boolean };
type PhoneRow = { countryCode: string; number: string; isPrimary: boolean };

export function Account() {
  const t = useTranslations("account");
  const { user, status, refresh } = useAuth();
  const [editing, setEditing] = useState(false);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {t("editProfile")}
          </Button>
        )}
      </div>

      {editing ? (
        <AccountEditor
          user={user}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            await refresh();
            setEditing(false);
          }}
        />
      ) : (
        <AccountView user={user} />
      )}
    </div>
  );
}

function AccountView({ user }: { user: UserProfile }) {
  const t = useTranslations("account");

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <span
          className="h-16 w-16 flex-none rounded-full bg-linear-to-br from-accent to-[#60a5fa] bg-cover"
          style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}
        />
        <div>
          <div className="text-lg font-semibold text-text">
            {user.firstName} {user.lastName}
          </div>
          <div className="mt-1">
            <RoleBadge role={user.role} />
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-5 text-sm leading-relaxed text-text-2">{user.bio}</p>}

      <dl className="mt-6 space-y-4 text-sm">
        <Field label={t("country")} value={user.country} />
        <Field label={t("address")} value={user.address} />
        <div>
          <dt className="text-text-3">{t("emails")}</dt>
          <dd className="mt-1 space-y-1.5">
            {user.emails.map((e) => (
              <EmailVerifyItem key={e.id} email={e} />
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-text-3">{t("phones")}</dt>
          <dd className="mt-1 space-y-2.5">
            {user.phones.map((p) => (
              <PhoneVerifyItem key={p.id} phone={p} />
            ))}
          </dd>
        </div>
      </dl>

    </Card>
  );
}

// One email row in the read view: shows verified status and, for unverified
// addresses, its own resend button so each can be verified individually.
function EmailVerifyItem({ email }: { email: EmailDTO }) {
  const t = useTranslations("account");
  const [sent, setSent] = useState(false);

  async function resend() {
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: { email: email.address },
      });
    } catch {
      /* swallow — confirmation is intentionally generic */
    } finally {
      setSent(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-text">{email.address}</span>
      {email.isPrimary && <Pill>{t("primary")}</Pill>}
      {email.verified ? (
        <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
          {t("verified")}
        </span>
      ) : (
        <>
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">
            {t("unverified")}
          </span>
          {sent ? (
            <span className="text-xs font-medium text-text-3">{t("verificationSent")}</span>
          ) : (
            <button
              onClick={resend}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t("resendVerification")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AccountEditor({
  user,
  onCancel,
  onSaved,
}: {
  user: UserProfile;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const t = useTranslations("account");
  const em = useErrorMessage();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth?.slice(0, 10) ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [emails, setEmails] = useState<EmailRow[]>(
    user.emails.map((e) => ({ address: e.address, isPrimary: e.isPrimary, verified: e.verified })),
  );
  const [phones, setPhones] = useState<PhoneRow[]>(
    user.phones.map((p) => ({ countryCode: p.countryCode, number: p.number, isPrimary: p.isPrimary })),
  );
  const [saving, setSaving] = useState(false);

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
      fd.append("kind", "avatar");
      const { url } = await api<{ url: string }>("/uploads", { method: "POST", body: fd });
      setAvatarUrl(url);
      toast.success(t("uploadSuccess"));
    } catch (err) {
      toast.error(em(err, t("uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/account", {
        method: "PATCH",
        body: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          country: country || null,
          address: address || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          emails: emails
            .filter((em) => em.address.trim())
            .map((em) => ({ address: em.address, isPrimary: em.isPrimary })),
          phones: phones
            .filter((p) => p.number.trim())
            .map((p) => ({ countryCode: p.countryCode, number: p.number, isPrimary: p.isPrimary })),
        },
      });
      toast.success(t("saveSuccess"));
      await onSaved();
    } catch (err) {
      setSaving(false);
      toast.error(em(err, t("saveError")));
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <span
            className="h-16 w-16 flex-none rounded-full border border-border bg-surface-3 bg-cover"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          />
          <label className="cursor-pointer rounded-lg border border-dashed border-border-strong px-4 py-2.5 text-sm text-text-2 hover:border-accent hover:bg-accent-soft">
            {uploading ? t("uploading") : t("changePhoto")}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
          </label>
        </div>

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

        <RowEditor
          title={t("emailAddresses")}
          rows={emails}
          onAdd={() => setEmails((r) => [...r, { address: "", isPrimary: false }])}
          onRemove={(i) => setEmails((r) => r.filter((_, idx) => idx !== i))}
          onPrimary={(i) => setEmails((r) => r.map((row, idx) => ({ ...row, isPrimary: idx === i })))}
          render={(em, i) => (
            <Input
              type="email"
              value={em.address}
              onChange={(e) =>
                setEmails((r) => r.map((row, idx) => (idx === i ? { ...row, address: e.target.value } : row)))
              }
              placeholder={t("emailPlaceholder")}
              className="flex-1"
              aria-label={t("emailAddressLabel")}
            />
          )}
        />

        <RowEditor
          title={t("phones")}
          rows={phones}
          onAdd={() => setPhones((r) => [...r, { countryCode: "+44", number: "", isPrimary: false }])}
          onRemove={(i) => setPhones((r) => r.filter((_, idx) => idx !== i))}
          onPrimary={(i) => setPhones((r) => r.map((row, idx) => ({ ...row, isPrimary: idx === i })))}
          render={(p, i) => (
            <>
              <Input
                value={p.countryCode}
                onChange={(e) =>
                  setPhones((r) => r.map((row, idx) => (idx === i ? { ...row, countryCode: e.target.value } : row)))
                }
                className="w-20"
                aria-label={t("countryCode")}
              />
              <Input
                value={p.number}
                onChange={(e) =>
                  setPhones((r) => r.map((row, idx) => (idx === i ? { ...row, number: e.target.value } : row)))
                }
                placeholder={t("phoneNumberPlaceholder")}
                className="flex-1"
                aria-label={t("phoneNumberPlaceholder")}
              />
            </>
          )}
        />

        <div>
          <Label htmlFor="bio">{t("bio")}</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            className="h-20 w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            placeholder={t("bioPlaceholder")}
          />
          <div className="mt-1 text-end text-[11px] text-text-3">{bio.length} / 280</div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            {t("saveChanges")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RowEditor<T extends { isPrimary: boolean }>({
  title,
  rows,
  onAdd,
  onRemove,
  onPrimary,
  render,
}: {
  title: string;
  rows: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onPrimary: (i: number) => void;
  render: (row: T, i: number) => React.ReactNode;
}) {
  const t = useTranslations("account");
  return (
    <div>
      <Label>{title}</Label>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {render(row, i)}
            <button
              type="button"
              onClick={() => onPrimary(i)}
              className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${row.isPrimary ? "border-accent-line bg-accent-soft text-accent" : "border-border-strong text-text-3 hover:text-text-2"}`}
            >
              {row.isPrimary ? t("primary") : t("setPrimary")}
            </button>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="h-9 w-9 flex-none rounded-lg border border-border-strong text-text-3 hover:border-danger hover:text-danger"
                aria-label={t("removeFrom", { title })}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-dashed border-border-strong px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft"
        >
          {t("add")}
        </button>
      </div>
    </div>
  );
}

/**
 * One phone row in the read view: shows verified status and, for unverified
 * numbers, an inline SMS-verification flow (send a code → enter it → confirm).
 */
function PhoneVerifyItem({ phone }: { phone: PhoneDTO }) {
  const t = useTranslations("account");
  const em = useErrorMessage();
  const { refresh } = useAuth();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function sendCode() {
    setSending(true);
    try {
      await api("/account/phones/request-code", {
        method: "POST",
        body: { countryCode: phone.countryCode, number: phone.number },
      });
      setSent(true);
    } catch (err) {
      toast.error(em(err, t("codeSendError")));
    } finally {
      setSending(false);
    }
  }

  async function confirm() {
    setConfirming(true);
    try {
      await api("/account/phones/confirm", {
        method: "POST",
        body: { countryCode: phone.countryCode, number: phone.number, code },
      });
      toast.success(t("phoneVerifiedToast"));
      await refresh(); // reflect the now-verified status from the server
    } catch (err) {
      toast.error(em(err, t("verifyPhoneError")));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-text">
          {phone.countryCode} {phone.number}
        </span>
        {phone.isPrimary && <Pill>{t("primary")}</Pill>}
        {phone.verified ? (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
            {t("verified")}
          </span>
        ) : (
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">
            {t("unverified")}
          </span>
        )}
        {!phone.verified && !sent && (
          <button
            type="button"
            onClick={sendCode}
            disabled={sending}
            className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
          >
            {sending ? t("sendingCode") : t("verify")}
          </button>
        )}
      </div>

      {!phone.verified && sent && (
        <div className="mt-2 ps-1">
          <div className="flex items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("enterCode")}
              aria-label={t("enterCode")}
              className="w-44"
            />
            <Button size="sm" onClick={confirm} loading={confirming} disabled={code.length !== 6}>
              {confirming ? t("verifyingCode") : t("confirmCode")}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-text-3">{t("codeSentNotice")}</p>
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-text-3">{label}</dt>
      <dd className="mt-0.5 text-text">{value}</dd>
    </div>
  );
}
