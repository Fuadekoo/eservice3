"use client";

import { User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Who a request was submitted for. `null` means the applicant themselves. */
export type Beneficiary = {
  name: string;
  phoneNumber: string;
  relationship: string;
} | null;

/**
 * How to describe who a request is for, in one word.
 *
 * Returns a translation key: "Myself" for an ordinary request, or the
 * relationship ("child", "parent", …) for one submitted on behalf of a family
 * member.
 */
export function beneficiaryLabel(beneficiary: Beneficiary): string {
  return beneficiary ? beneficiary.relationship : "Myself";
}

/**
 * Marks every request row with who it is for.
 *
 * Self-requests are labelled too, rather than left blank — in a list holding
 * both kinds, an unlabelled row reads as missing data rather than as "mine".
 */
export function BeneficiaryBadge({
  beneficiary,
  className,
}: {
  beneficiary: Beneficiary;
  className?: string;
}) {
  const { t } = useTranslation();
  const isForOther = Boolean(beneficiary);
  const Icon = isForOther ? Users : User;

  return (
    <Badge
      variant="outline"
      className={cn(
        "max-w-56 gap-1.5 font-semibold",
        isForOther
          ? "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "text-muted-foreground",
        className,
      )}
      title={
        beneficiary
          ? `${t(beneficiary.relationship)} · ${beneficiary.name}`
          : t("Myself")
      }
    >
      <Icon aria-hidden />
      <span className="truncate capitalize">
        {beneficiary ? t(beneficiary.relationship) : t("Myself")}
      </span>
      {beneficiary ? (
        <span className="truncate font-normal opacity-80">
          · {beneficiary.name}
        </span>
      ) : null}
    </Badge>
  );
}
