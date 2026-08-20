import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
const inter=Inter({variable:"--font-inter",subsets:["latin"]});
const jakarta=Plus_Jakarta_Sans({variable:"--font-jakarta",subsets:["latin"]});
export const metadata:Metadata={title:"Açaí 24 horas Pn | Seu açaí, do seu jeito",description:"Açaí fresco, cremoso e preparado na hora em São Paulo. Faça seu pedido pelo WhatsApp."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body className={`${inter.variable} ${jakarta.variable}`}>{children}</body></html>}
