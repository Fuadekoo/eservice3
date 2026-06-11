"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import {
  login as authLogin,
  verifyTwoFactor,
  isAuthenticated,
} from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/password-input";

function EServiceLogo() {
  return (
    <div className="flex items-center justify-center animate-in fade-in duration-700">
      <Image
        src="/logo.png"
        alt="Mesob E-Service System Logo"
        width={200}
        height={200}
        className="object-contain"
        priority
      />
    </div>
  );
}

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^[0-9+\-\s()]+$/,
      "Phone number must contain only numbers and valid characters",
    )
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must not exceed 20 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const DEMO_CREDENTIALS = [
  {
    role: "Admin",
    phone: "0900000000",
    password: "password123",
    description: "System Administrator",
  },
  {
    role: "Manager",
    phone: "0911111111",
    password: "password123",
    description: "Office Manager",
  },
  {
    role: "Staff",
    phone: "0922222222",
    password: "password123",
    description: "Office Staff",
  },
  {
    role: "Customer",
    phone: "0933333333",
    password: "password123",
    description: "Test Customer",
  },
];

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [twoFactorState, setTwoFactorState] = React.useState<{
    required: boolean;
    userId: string;
  } | null>(null);
  const [otpValue, setOtpValue] = React.useState("");
  const [isVerifying2FA, setIsVerifying2FA] = React.useState(false);
  const { loadTranslations, getTranslationForKey } = useLanguagesStore();

  // Redirect already-authenticated users away from the sign-in page
  React.useEffect(() => {
    if (isAuthenticated()) {
      router.replace(callbackUrl || "/dashboard");
    }
  }, [router, callbackUrl]);

  React.useEffect(() => {
    loadTranslations();
  }, []);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const fillDemoCredentials = React.useCallback(
    (phone: string, password: string) => {
      form.setValue("phone", phone);
      form.setValue("password", password);
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (credentials) => {
    try {
      const result = await authLogin(credentials.phone, credentials.password);

      // Check if 2FA is required
      if ("requiresTwoFactor" in result && result.requiresTwoFactor) {
        setTwoFactorState({
          required: true,
          userId: result.userId,
        });
        setOtpValue("");
        toast.info(getTranslationForKey("Two-factor authentication required"), {
          description: getTranslationForKey(
            "Please enter the code from your authenticator app",
          ),
        });
        return;
      }

      // Normal login success
      router.replace(callbackUrl || "/dashboard");
      toast.success(getTranslationForKey("Success"), {
        description: getTranslationForKey("Signing in successful"),
      });
    } catch (error: any) {
      toast.error(getTranslationForKey("Error"), {
        description: error.message
          ? getTranslationForKey(error.message)
          : getTranslationForKey("Signing in failed"),
      });
    }
  });

  const handleVerify2FA = React.useCallback(
    async (code: string) => {
      if (!twoFactorState || code.length !== 6) return;

      setIsVerifying2FA(true);
      try {
        await verifyTwoFactor(twoFactorState.userId, code);
        router.replace(callbackUrl || "/dashboard");
        toast.success(getTranslationForKey("Success"), {
          description: getTranslationForKey("Signing in successful"),
        });
      } catch (error: any) {
        toast.error(getTranslationForKey("Error"), {
          description: error.message
            ? getTranslationForKey(error.message)
            : getTranslationForKey("Verification failed"),
        });
        setOtpValue("");
      } finally {
        setIsVerifying2FA(false);
      }
    },
    [twoFactorState, router, getTranslationForKey],
  );

  // Auto-submit when 6 digits are entered
  React.useEffect(() => {
    if (otpValue.length === 6 && twoFactorState) {
      handleVerify2FA(otpValue);
    }
  }, [otpValue, twoFactorState, handleVerify2FA]);

  return (
    <div className="bg-linear-to-br from-primary/20 via-background to-primary/20  flex min-h-dvh flex-col items-center-justify-center gap-2 overflow-auto p-4 md:p-6 lg:p-10">
      <div className=" p-2 flex items-center justify-end gap-5 ">
        <ThemeToggle />
        <Separator orientation="vertical" className="max-h-6" />
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm md:max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0 shadow-xl border-0 md:border">
            <CardContent className="grid p-0 md:grid-cols-2">
              {twoFactorState ? (
                /* ── 2FA Verification Screen ── */
                <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center items-center min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-400">
                  <div className="w-full max-w-sm space-y-8">
                    {/* Shield Icon */}
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="relative">
                        <div className="absolute -inset-3 bg-primary/10 rounded-full blur-lg animate-pulse" />
                        <div className="relative flex items-center justify-center size-16 rounded-full bg-primary/10 border border-primary/20">
                          <ShieldCheck className="size-8 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold tracking-tight">
                          {getTranslationForKey("Two-Factor Authentication")}
                        </h2>
                        <p className="text-sm text-muted-foreground text-balance">
                          {getTranslationForKey(
                            "Enter the 6-digit code from your authenticator app",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpValue}
                        onChange={setOtpValue}
                        disabled={isVerifying2FA}
                        autoFocus
                      >
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            className="size-12 text-lg font-semibold"
                          />
                          <InputOTPSlot
                            index={1}
                            className="size-12 text-lg font-semibold"
                          />
                          <InputOTPSlot
                            index={2}
                            className="size-12 text-lg font-semibold"
                          />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={3}
                            className="size-12 text-lg font-semibold"
                          />
                          <InputOTPSlot
                            index={4}
                            className="size-12 text-lg font-semibold"
                          />
                          <InputOTPSlot
                            index={5}
                            className="size-12 text-lg font-semibold"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {/* Verify Button */}
                    <Button
                      className="w-full rounded-full h-11 text-base font-medium shadow-sm hover:shadow-md transition-all"
                      disabled={otpValue.length !== 6 || isVerifying2FA}
                      onClick={() => handleVerify2FA(otpValue)}
                    >
                      {isVerifying2FA ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          {getTranslationForKey("Verifying...")}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4 mr-2" />
                          {getTranslationForKey("Verify & Sign In")}
                        </>
                      )}
                    </Button>

                    {/* Back to login */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFactorState(null);
                          setOtpValue("");
                        }}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="size-3.5" />
                        {getTranslationForKey("Back to login")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Normal Login Form ── */
                <Form {...form}>
                  <form
                    onSubmit={onSubmit}
                    className="p-6 md:p-8 lg:p-10 flex flex-col justify-center min-h-[500px]"
                  >
                    <FieldGroup className="">
                      <div className="flex flex-col items-center gap-3 text-center mb-2">
                        <div className="mb-2 md:hidden">
                          <EServiceLogo />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                          {getTranslationForKey("Welcome back")}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base text-balance max-w-sm">
                          {getTranslationForKey(
                            "Sign in to your Mesob E-Service System account to continue",
                          )}
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormControl>
                              <InputGroup
                                className={cn(
                                  "rounded-full transition-all",
                                  fieldState.error && "border-destructive",
                                )}
                              >
                                <InputGroupAddon>
                                  <Phone className="size-4 text-muted-foreground" />
                                </InputGroupAddon>
                                <InputGroupInput
                                  id="phone"
                                  type="tel"
                                  placeholder="+251911234567"
                                  disabled={form.formState.isSubmitting}
                                  {...field}
                                />
                              </InputGroup>
                            </FormControl>
                            <FormMessage className="text-xs mt-1.5 ml-4">
                              {fieldState.error?.message
                                ? getTranslationForKey(fieldState.error.message)
                                : ""}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <div className="flex items-center justify-end mb-1.5">
                              <Link
                                href={
                                  callbackUrl
                                    ? `/forget-password?callbackUrl=${encodeURIComponent(callbackUrl)}`
                                    : "/forget-password"
                                }
                                className="text-xs text-primary hover:underline underline-offset-2 transition-colors"
                              >
                                {getTranslationForKey("Forgot password?")}
                              </Link>
                            </div>
                            <FormControl>
                              <PasswordInput
                                id="password"
                                placeholder={getTranslationForKey(
                                  "Enter your password",
                                )}
                                disabled={form.formState.isSubmitting}
                                className={cn(
                                  "rounded-full transition-all",
                                  fieldState.error && "border-destructive",
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs mt-1.5 ml-4">
                              {fieldState.error?.message
                                ? getTranslationForKey(fieldState.error.message)
                                : ""}
                            </FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormItem className="pt-2">
                        <Button
                          type="submit"
                          className="w-full rounded-full h-11 text-base font-medium shadow-sm hover:shadow-md transition-all"
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              {getTranslationForKey("Signing in...")}
                            </>
                          ) : (
                            getTranslationForKey("Sign In")
                          )}
                        </Button>
                      </FormItem>

                      <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">
                          {getTranslationForKey("Don't have an account?")}{" "}
                        </span>
                        <Link
                          href={
                            callbackUrl
                              ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
                              : "/signup"
                          }
                          className="text-primary hover:underline underline-offset-4 font-medium transition-colors"
                        >
                          {getTranslationForKey("Create an account")}
                        </Link>
                      </div>
                    </FieldGroup>
                  </form>
                </Form>
              )}

              <div className="bg-linear-to-br from-lime-50 to-green-50 dark:from-lime-950/20 dark:to-green-950/20 relative max-md:hidden grid place-content-center p-8 lg:p-12 border-l">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="relative z-10 flex flex-col items-center justify-center gap-6">
                  <EServiceLogo />
                  <div className="text-center space-y-2 max-w-xs">
                    <h2 className="text-xl font-semibold text-foreground">
                      {getTranslationForKey("Mesob E-Service System")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {getTranslationForKey(
                        "Streamline your document operations with our comprehensive management system",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Collapsible className="w-full max-w-sm md:max-w-5xl mx-auto border rounded-xl bg-card/50 overflow-hidden shadow-sm">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Zap className="size-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {getTranslationForKey("Mesob E-Service Access")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTranslationForKey(
                      "sign in with seeded Mesob E-Service accounts",
                    )}
                  </p>
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t bg-muted/30">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() =>
                      fillDemoCredentials(cred.phone, cred.password)
                    }
                    className="flex flex-col items-start gap-1 p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all text-left group"
                  >
                    <span className="text-xs font-bold text-primary group-hover:text-primary/80">
                      {getTranslationForKey(cred.role)}
                    </span>
                    <span className="text-[11px] font-medium text-foreground/70">
                      {cred.phone}
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">
                      {getTranslationForKey(cred.description)}
                    </span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <FieldDescription className="px-4 text-center text-xs text-muted-foreground">
            {getTranslationForKey("By signing in, you agree to our")}{" "}
            <Link
              href="/terms-of-service"
              className="text-primary no-underline! hover:underline!"
            >
              {getTranslationForKey("Terms of Service")}
            </Link>{" "}
            {getTranslationForKey("and")}{" "}
            <Link
              href="/privacy-policy"
              className="text-primary no-underline! hover:underline!  "
            >
              {getTranslationForKey("Privacy Policy")}
            </Link>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
