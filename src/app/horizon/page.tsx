import { getFringeOfTheHorizonProjection } from '@/lib/domain/fringe-of-the-horizon/projection';
import HorizonList from '@/lib/domain/fringe-of-the-horizon/ui/HorizonList';

type SearchParams = { sort?: 'level-asc' | 'level-desc'; companyId?: string };

export default async function HorizonPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { sort, companyId } = await searchParams;
  let items = await getFringeOfTheHorizonProjection(20);

  if (sort === 'level-asc') {
    items = items.slice().sort((a, b) => a.teamLevel - b.teamLevel || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'level-desc') {
    items = items.slice().sort((a, b) => b.teamLevel - a.teamLevel || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Keep the route minimal: render the domain UI component
  return <HorizonList items={items} />;
}
