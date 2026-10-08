"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LanguageMenu } from "@/components/LanguageMenu";

/** Translated heading + language menu for the auth pages. */
export function AuthI18n({ kind }: { kind?: "loginTitle" | "signupTitle" }) {
  const { t } = useI18n();

  if (!kind) {
    return <LanguageMenu />;
  }

  const isLogin = kind === "loginTitle";
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        {isLogin ? t("auth.welcomeBack") : t("auth.joinTitle")}
      </h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        {isLogin ? t("auth.loginSub") : t("auth.signupSub")}
      </p>
    </div>
  );
}
