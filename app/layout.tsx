import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
const inter=Inter({variable:"--font-inter",subsets:["latin"]});
const jakarta=Plus_Jakarta_Sans({variable:"--font-jakarta",subsets:["latin"]});
export const metadata:Metadata={title:"Açaí 24 horas | Monte do seu jeito",description:"Monte seu açaí com até 8 adicionais grátis e receba até meia-noite.",openGraph:{title:"Açaí 24 horas",description:"Monte do seu jeito.",images:["/og.png"]},twitter:{card:"summary_large_image",title:"Açaí 24 horas",description:"Monte do seu jeito.",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body className={`${inter.variable} ${jakarta.variable}`}>{children}</body></html>}
