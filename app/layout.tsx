import './globals.css';
import Install from '@/components/Install';
export const metadata = {title:'AnimaPro CRM Intelligence', description:'Gestão inteligente de clientes e vendas', manifest:'/manifest.webmanifest', icons:{apple:'/crm-192.png'}};
export const viewport = {themeColor:'#211437'};
export default function Root({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}<Install /></body></html>;
}
