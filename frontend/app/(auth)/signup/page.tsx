"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  CheckCircle2,
  UserCircle2,
  ChevronLeft,
  RefreshCw,
  FileText,
  Clock,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { axiosInstance } from "@/lib/axios";
import { setToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import z from "zod";
import { strongPasswordSchema } from "@/lib/password-strength";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits.")
    .max(20, "Phone number is too long.")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number."),
});

const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    fatherName: z.string().trim().min(1, "Father's name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PhoneValues = z.infer<typeof phoneSchema>;
type ProfileValues = z.infer<typeof profileSchema>;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Welcome" },
  { label: "Phone" },
  { label: "Verify" },
  { label: "Profile" },
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

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { t } = useTranslation();
  const [step, setStep] = React.useState(1);
  const [phone, setPhone] = React.useState("");
  const [generatedOtp, setGeneratedOtp] = React.useState("");
  const [otpInput, setOtpInput] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

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

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ── OTP helpers ──────────────────────────────────────────────────────────

  const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  const sendOtp = async (values: PhoneValues) => {
    setIsSendingOtp(true);
    setPhone(values.phone);
    const code = makeOtp();
    setGeneratedOtp(code);
    await new Promise((r) => setTimeout(r, 700));
    setIsSendingOtp(false);
    setStep(3);
    setResendCooldown(60);
    toast.success(t("OTP sent"), {
      description: `${t("Your verification code")}: ${code}`,
    });
  };

  const resendOtp = async () => {
    const code = makeOtp();
    setGeneratedOtp(code);
    setOtpInput("");
    setOtpError("");
    setResendCooldown(60);
    toast.success(t("OTP resent"), {
      description: `${t("Your verification code")}: ${code}`,
    });
  };

  const verifyOtp = React.useCallback(
    (code: string) => {
      if (code.length !== 6) return;
      setIsVerifyingOtp(true);
      setTimeout(() => {
        setIsVerifyingOtp(false);
        if (code === generatedOtp) {
          setStep(4);
          toast.success(t("Phone verified!"));
        } else {
          setOtpError(t("Invalid code. Please try again."));
          setOtpInput("");
        }
      }, 600);
    },
    [generatedOtp, t],
  );

  React.useEffect(() => {
    if (otpInput.length === 6) verifyOtp(otpInput);
  }, [otpInput, verifyOtp]);

  // ── Profile submit ────────────────────────────────────────────────────────

  const onSubmitProfile = async (values: ProfileValues) => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/auth/register/customer", {
        firstName: values.firstName,
        fatherName: values.fatherName,
        lastName: values.lastName,
        username: values.username,
        phone,
        password: values.password,
      });

      const { data, message } = response as { data: any; message?: string };

      if (data?.token) {
        setToken(data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", JSON.stringify(data.role));
        localStorage.setItem(
          "permissions",
          JSON.stringify(data.permissions || []),
        );
        if (data.office) {
          localStorage.setItem("office", JSON.stringify(data.office));
          localStorage.setItem("officeId", data.office.id);
        }
      }

      toast.success(message || t("Registration successful!"));
      router.push(callbackUrl || "/customer-overview");
    } catch (error: any) {
      toast.error(
        error?.message || t("Registration failed. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-linear-to-br from-primary/20 via-background to-primary/20 flex flex-col items-center justify-center p-4 md:p-6 lg:p-10">
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <Link
          href={
            callbackUrl
              ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/signin"
          }
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {t("Sign In")}
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

            {/* Step indicator (hidden on welcome) */}
            {step > 1 && <StepIndicator current={step} />}

            {/* ── Step 1: Welcome ─────────────────────────────────── */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                    <Sparkles className="size-3" />
                    {t("New Account")}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {t("Welcome to E-Service")}
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                    {t(
                      "Your gateway to digital government services. Track requests, book appointments, and manage documents — all in one place.",
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon: FileText,
                      title: "Easy document requests",
                      desc: "Submit and track service requests online",
                    },
                    {
                      icon: Clock,
                      title: "Real-time updates",
                      desc: "Get notified on your request status",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Secure & private",
                      desc: "Your data is protected end-to-end",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-muted-foreground/10"
                    >
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t(item.title)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(item.desc)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all gap-2"
                  onClick={() => setStep(2)}
                >
                  {t("Get Started")}
                  <ArrowRight className="size-5" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t("Already have an account?")}{" "}
                  <Link
                    href={
                      callbackUrl
                        ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
                        : "/signin"
                    }
                    className="text-primary hover:underline underline-offset-4 font-semibold"
                  >
                    {t("Sign In")}
                  </Link>
                </p>
              </div>
            )}

            {/* ── Step 2: Phone ───────────────────────────────────── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <Phone className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {t("Enter your phone")}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      "We'll send a verification code to confirm your number.",
                    )}
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
                            {t("Phone Number")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+251 91 234 5678"
                              autoFocus
                              className={cn(
                                "h-12 rounded-xl bg-muted/30 border-muted-foreground/20 text-base transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage>
                            {fieldState.error?.message
                              ? t(fieldState.error.message)
                              : ""}
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
                          {t("Sending...")}
                        </>
                      ) : (
                        <>
                          {t("Send OTP")}
                          <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  {t("Back")}
                </button>
              </div>
            )}

            {/* ── Step 3: OTP ─────────────────────────────────────── */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <ShieldCheck className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {t("Verify your phone")}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t("Enter the 6-digit code sent to")}{" "}
                    <span className="font-semibold text-foreground">
                      {phone}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <InputOTP
                    maxLength={6}
                    value={otpInput}
                    onChange={(v) => {
                      setOtpInput(v);
                      setOtpError("");
                    }}
                    disabled={isVerifyingOtp}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="size-12 text-lg font-bold"
                      />
                      <InputOTPSlot
                        index={1}
                        className="size-12 text-lg font-bold"
                      />
                      <InputOTPSlot
                        index={2}
                        className="size-12 text-lg font-bold"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={3}
                        className="size-12 text-lg font-bold"
                      />
                      <InputOTPSlot
                        index={4}
                        className="size-12 text-lg font-bold"
                      />
                      <InputOTPSlot
                        index={5}
                        className="size-12 text-lg font-bold"
                      />
                    </InputOTPGroup>
                  </InputOTP>

                  {isVerifyingOtp && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {t("Verifying...")}
                    </div>
                  )}

                  {otpError && (
                    <p className="text-sm text-destructive font-medium text-center">
                      {otpError}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 gap-2"
                  disabled={otpInput.length !== 6 || isVerifyingOtp}
                  onClick={() => verifyOtp(otpInput)}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {t("Verifying...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" />
                      {t("Verify Code")}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setOtpInput("");
                      setOtpError("");
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                    {t("Change number")}
                  </button>

                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resendCooldown > 0}
                    className="flex items-center gap-1 text-primary hover:underline underline-offset-4 font-semibold disabled:opacity-50 disabled:no-underline transition-all"
                  >
                    <RefreshCw className="size-3.5" />
                    {resendCooldown > 0
                      ? `${t("Resend")} (${resendCooldown}s)`
                      : t("Resend OTP")}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Profile ─────────────────────────────────── */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <UserCircle2 className="size-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {t("Complete your profile")}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t("Just a few more details to finish setting up.")}
                  </p>
                </div>

                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                    className="space-y-4"
                  >
                    {/* Name Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* First Name */}
                      <FormField
                        name="firstName"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold flex items-center gap-2 mb-1.5 uppercase tracking-wider text-muted-foreground">
                              {t("First Name")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("Abebe")}
                                autoFocus
                                className={cn(
                                  "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                  fieldState.error && "border-destructive",
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]">
                              {fieldState.error?.message
                                ? t(fieldState.error.message)
                                : ""}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      {/* Father Name */}
                      <FormField
                        name="fatherName"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold flex items-center gap-2 mb-1.5 uppercase tracking-wider text-muted-foreground">
                              {t("Father's Name")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("Bikila")}
                                className={cn(
                                  "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                  fieldState.error && "border-destructive",
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]">
                              {fieldState.error?.message
                                ? t(fieldState.error.message)
                                : ""}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      {/* Last Name */}
                      <FormField
                        name="lastName"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold flex items-center gap-2 mb-1.5 uppercase tracking-wider text-muted-foreground">
                              {t("Last Name")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("Demissie")}
                                className={cn(
                                  "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                  fieldState.error && "border-destructive",
                                )}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]">
                              {fieldState.error?.message
                                ? t(fieldState.error.message)
                                : ""}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Username */}
                    <FormField
                      name="username"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold flex items-center gap-2 mb-1.5">
                            <ShieldCheck className="size-3.5 text-primary" />
                            {t("Username")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("Choose a unique username")}
                              className={cn(
                                "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage>
                            {fieldState.error?.message
                              ? t(fieldState.error.message)
                              : ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      name="password"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold flex items-center gap-2 mb-1.5">
                            <Lock className="size-3.5 text-primary" />
                            {t("Password")}
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              showStrength
                              placeholder="••••••••"
                              className={cn(
                                "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]">
                            {fieldState.error?.message
                              ? t(fieldState.error.message)
                              : ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                    {/* Confirm Password */}
                    <FormField
                      name="confirmPassword"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold flex items-center gap-2 mb-1.5">
                            <Lock className="size-3.5 text-primary" />
                            {t("Confirm Password")}
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              placeholder="••••••••"
                              className={cn(
                                "h-11 rounded-xl bg-muted/30 border-muted-foreground/20 transition-all",
                                fieldState.error && "border-destructive",
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]">
                            {fieldState.error?.message
                              ? t(fieldState.error.message)
                              : ""}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          {t("Creating account...")}
                        </>
                      ) : (
                        <>
                          {t("Create Account")}
                          <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 bg-muted/30 border-t text-center text-xs text-muted-foreground">
            {t("By signing up, you agree to our")}{" "}
            <Link
              href="/terms-of-service"
              className="text-primary hover:underline underline-offset-4"
            >
              {t("Terms of Service")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/privacy-policy"
              className="text-primary hover:underline underline-offset-4"
            >
              {t("Privacy Policy")}
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
