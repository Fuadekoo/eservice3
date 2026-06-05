"use client";

import { NextIntlClientProvider } from "next-intl";

export function IntlProvider({
  messages,
  locale,
  timeZone,
  children,
}: {
  messages: any;
  locale: string;
  timeZone: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone={timeZone}
      getMessageFallback={({ key }) => key}
      onError={(error) => {
        if (error.code === "MISSING_MESSAGE") return;
        console.error(error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
