import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Açaí 24 horas | Monte do seu jeito",description:"Monte seu açaí com até 8 adicionais grátis e receba até meia-noite.",icons:{icon:"/logo-acai-24-horas.jpg",shortcut:"/logo-acai-24-horas.jpg",apple:"/logo-acai-24-horas.jpg"},openGraph:{title:"Açaí 24 horas",description:"Monte do seu jeito.",images:["/og.png"]},twitter:{card:"summary_large_image",title:"Açaí 24 horas",description:"Monte do seu jeito.",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
