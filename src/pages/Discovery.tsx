import {Link} from 'react-router-dom';
import {Search} from 'lucide-react';
import {BackButton} from '@/components/ui/back-button';
import {Button} from '@/components/ui/button';
import BoostedDiscovery from '@/components/BoostedDiscovery';
import {GameChannels} from '@/components/GameChannels';
import {GameChannelBrowser} from '@/components/GameChannelBrowser';
export default function Discovery(){return <main className="clipt-discovery mx-auto max-w-6xl space-y-6 px-4 py-6">
  <header className="space-y-4"><BackButton/><h1 className="text-2xl font-bold">Discovery</h1><Button asChild variant="outline" className="w-full justify-start"><Link to="/retro-search"><Search aria-hidden="true" className="mr-2 h-4 w-4"/>Search games, creators and Clipts</Link></Button><Button asChild variant="outline"><Link to="/top-games">Browse all games</Link></Button></header>
  <GameChannels/><BoostedDiscovery/><GameChannelBrowser/>
</main>;}
