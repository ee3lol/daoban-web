import { getUserSessions, getConnectedAccounts, getWatchLater, getFavorites } from '@/lib/actions/user';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import ProfileTabs from './profile-tabs';

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/');
  }

  const user = session.user;
  const sessionData = await getUserSessions();
  const connectedAccounts = await getConnectedAccounts();
  const watchLater = await getWatchLater();
  const favorites = await getFavorites();

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#050505] text-[#EAE8E3] font-sans flex">
      <ProfileTabs
        user={user}
        sessionData={sessionData}
        connectedAccounts={connectedAccounts}
        watchLater={watchLater}
        favorites={favorites}
      />
    </main>
  );
}
