import PosSystem from '@/components/pos/pos-system';
import { Head, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';

export default function PosPage() {
  const { settings } = usePage().props
  console.log("settings", settings)
  return (
    <>
      <Head title="Point of Sale">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>
      <main className="min-h-screen bg-background">
        <PosSystem />
      </main>
      <Toaster />
    </>
  );
}
