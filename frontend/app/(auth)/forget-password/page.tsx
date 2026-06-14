"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { axiosInstance } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { strongPasswordSchema } from "@/lib/password-strength";
import {
  ethiopianMobilePhoneSchema,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: ethiopianMobilePhoneSchema,
});

const resetSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PhoneValues = z.infer<typeof phoneSchema>;
type ResetValues = z.infer<typeof resetSchema>;

type OtpResponse = {
  message?: string;
  _devOtp?: string;
};

type VerifyOtpResponse = {
  data?: {
    resetToken?: string;
  };
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Phone" },
  { label: "Verify" },
  { label: "Reset" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                  done &&
                    "bg-primary border-primary text-primary-foreground scale-90",
                  active &&
                    "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30",
                  !done &&
                    !active &&
                    "bg-muted border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : idx}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider hidden sm:block transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 sm:w-16 mx-1 rounded-full transition-all duration-500",
                  idx < current ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [step, setStep] = React.useState(1);
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const signinHref = callbackUrl
    ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/signin";

  // Resend countdown
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // ── Step 1: Request OTP ──────────────────────────────────────────────────

  const sendOtp = async (values: PhoneValues) => {
    setIsSendingOtp(true);
    try {
      const normalizedPhone =
        normalizeEthiopianMobilePhone(values.phone) ?? values.phone;
      const res = (await axiosInstance.post("/auth/forgot-password/request", {
        phone: normalizedPhone,
      })) as OtpResponse;

      setPhone(normalizedPhone);
      setOtp("");
      setOtpError("");
      setResendCooldown(60);
      setStep(2);

      toast.success("Verification code sent", {
        description: "Check your phone for the 6-digit code.",
      });

      // Show dev OTP if backend returns it
      if (res._devOtp) {
        toast.info(`Dev mode — OTP: ${res._devOtp}`, { duration: 30000 });
      }
    } catch (error) {
      toast.error("Failed to send code", {
        description:
          error instanceof Error
            ? error.message
            : "Please check your number and try again.",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resendOtp = async () => {
    setIsResending(true);
    try {
      const res = (await axiosInstance.post("/auth/forgot-password/request", {
        phone,
      })) as OtpResponse;

      setOtp("");
      setOtpError("");
      setResendCooldown(60);

      toast.success("Code resent");

      if (res._devOtp) {
        toast.info(`Dev mode — OTP: ${res._devOtp}`, { duration: 30000 });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend code.",
      );
    } finally {
      setIsResending(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────

  const verifyOtp = React.useCallback(
    async (code: string) => {
      if (code.length !== 6 || isVerifyingOtp) return;
      setIsVerifyingOtp(true);
      setOtpError("");
      try {
        const res = (await axiosInstance.post("/auth/forgot-password/verify", {
          phone,
          otp: code,
        })) as VerifyOtpResponse;

        setResetToken(res?.data?.resetToken ?? "");
        setStep(3);
        toast.success("Phone verified!", {
          description: "Now set your new password.",
        });
      } catch (error) {
        setOtpError(
          error instanceof Error
            ? error.message
            : "Invalid code. Please try again.",
        );
        setOtp("");
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [phone, isVerifyingOtp],
  );

  const handleOtpChange = React.useCallback(
    (value: string) => {
      setOtp(value);
      setOtpError("");
      if (value.length === 6) void verifyOtp(value);
    },
    [verifyOtp],
  );

  // ── Step 3: Reset password ───────────────────────────────────────────────

  const onResetSubmit = async (values: ResetValues) => {
    setIsResetting(true);
    try {
      await axiosInstance.post("/auth/forgot-password/reset", {
        resetToken,
        newPassword: values.newPassword,
      });

      setStep(4);
      toast.success("Password reset successfully!", {
        description: "You can now sign in with your new password.",
      });
    } catch (error) {
      toast.error("Reset failed", {
        description:
          error instanceof Error ? error.message : "Please start over.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-linear-to-br from-primary/20 via-background to-primary/20 flex flex-col items-center justify-center p-4 md:p-6 lg:p-10">
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <Link
          href={signinHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Sign In
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="E-Service"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>

            {/* Step indicator (steps 1–3) */}
            {step <= 3 && <StepIndicator current={step} />}

            {/* ── Step 1: Phone ──────────────────────────────────── */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <Phone className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Forgot your password?
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                    Enter the phone number linked to your account. We&apos;ll send
                    a verification code to reset your password.
                  </p>
                </div>

                <Form {...phoneForm}>
                  <form
                    onSubmit={phoneForm.handleSubmit(sendOtp)}
                    className="space-y-4"
                  >
                    <FormField
                      name="phone"
                      control={phoneForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold flex items-center gap-2 mb-1.5">
                            <Phone className="size-3.5 text-primary" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="0912345678 or 251912345678"
                              autoFocus
                              className={cn(
                                "h-12 rounded-xl bg-muted/30 border-muted-foreground/20 text-base transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage>
                            {fieldState.error?.message ?? ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 gap-2"
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        <>
                          Send Verification Code
                          <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link
                    href={signinHref}
                    className="text-primary hover:underline underline-offset-4 font-semibold"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            )}

            {/* ── Step 2: OTP ─────────────────────────────────────── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <ShieldCheck className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Enter verification code
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{phone}</span>.
                    <br />
                    It expires in <span className="font-semibold text-primary">10 minutes</span>.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={isVerifyingOtp}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-12 text-lg font-bold" />
                      <InputOTPSlot index={1} className="size-12 text-lg font-bold" />
                      <InputOTPSlot index={2} className="size-12 text-lg font-bold" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="size-12 text-lg font-bold" />
                      <InputOTPSlot index={4} className="size-12 text-lg font-bold" />
                      <InputOTPSlot index={5} className="size-12 text-lg font-bold" />
                    </InputOTPGroup>
                  </InputOTP>

                  {isVerifyingOtp && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Verifying...
                    </div>
                  )}

                  {otpError && (
                    <p className="text-sm text-destructive font-medium text-center animate-in fade-in">
                      {otpError}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 gap-2"
                  disabled={otp.length !== 6 || isVerifyingOtp}
                  onClick={() => verifyOtp(otp)}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" />
                      Verify Code
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setOtpError("");
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                    Change number
                  </button>

                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="flex items-center gap-1 text-primary hover:underline underline-offset-4 font-semibold disabled:opacity-50 disabled:no-underline transition-all"
                  >
                    {isResending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    {resendCooldown > 0
                      ? `Resend (${resendCooldown}s)`
                      : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: New password ─────────────────────────────── */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <KeyRound className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Set new password
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Create a strong password for your account.
                  </p>
                </div>

                <Form {...resetForm}>
                  <form
                    onSubmit={resetForm.handleSubmit(onResetSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      name="newPassword"
                      control={resetForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold mb-1.5">
                            New Password
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              showStrength
                              placeholder="••••••••"
                              autoFocus
                              autoComplete="new-password"
                              className={cn(
                                "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]">
                            {fieldState.error?.message ?? ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="confirmPassword"
                      control={resetForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold mb-1.5">
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              className={cn(
                                "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]">
                            {fieldState.error?.message ?? ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all gap-2"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Resetting password...
                        </>
                      ) : (
                        <>
                          <KeyRound className="size-5" />
                          Reset Password
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* ── Step 4: Success ──────────────────────────────────── */}
            {step === 4 && (
              <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8 text-center py-4">
                {/* Animated success ring */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-green-500/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative flex items-center justify-center size-20 rounded-full bg-green-500/10 border-2 border-green-500/30">
                      <CheckCircle2 className="size-10 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-green-600 dark:text-green-400">
                    Password Reset!
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    Your password has been updated successfully. You can now sign
                    in with your new password.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 gap-2"
                    onClick={() => router.push(signinHref)}
                  >
                    <ArrowRight className="size-5" />
                    Sign In Now
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You will be redirected to the sign-in page.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step <= 3 && (
            <div className="px-6 sm:px-8 py-4 bg-muted/30 border-t text-center text-xs text-muted-foreground">
              Need help?{" "}
              <Link
                href="/signin"
                className="text-primary hover:underline underline-offset-4"
              >
                Contact support
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
