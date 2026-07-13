// app/providers.tsx
'use client'

import {HeroUIProvider} from '@heroui/react'
import {ThemeProvider as NextThemesProvider} from "next-themes";
import SupportWidget from '../../components/SupportWidget';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
      {children}
      <SupportWidget />
      </NextThemesProvider>
    </HeroUIProvider>
  )
}