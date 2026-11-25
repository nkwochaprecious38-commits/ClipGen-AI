import { MarketingNav } from '@/components/MarketingNav';
import { Footer } from '@/components/Footer';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><MarketingNav /><main>{children}</main><Footer /></>);
}
