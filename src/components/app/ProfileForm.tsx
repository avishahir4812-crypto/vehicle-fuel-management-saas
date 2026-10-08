"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Spinner } from "@/components/ui";

export function ProfileForm({ initialName }: { initialName: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <Field label={t("auth.fullName")} className="min-w-52 flex-1">
        <Input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" disabled={saving || name.trim().length < 2}>
        {saving ? <Spinner /> : saved ? <CheckCircle2 className="size-4 text-emerald-400" /> : null}
        {saving ? t("common.saving") : saved ? t("settings.saved") : t("common.save")}
      </Button>
    </form>
  );
}
