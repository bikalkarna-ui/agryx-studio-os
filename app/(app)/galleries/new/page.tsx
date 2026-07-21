'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Booking = {
  id: string;
  shoot_date: string;
  leads: { clients: { name: string } | null } | null;
};

export default function NewGalleryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    supabase
      .from('bookings')
      .select('id, shoot_date, leads(clients(name))')
      .order('shoot_date', { ascending: false })
      .then(({ data }) => setBookings((data as any) || []));
  }, []);

  async function upload() {
    if (!bookingId || !files || files.length === 0) {
      alert('Pick a booking and at least one photo.');
      return;
    }
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: studio } = await supabase.from('studios').select('id').eq('owner_id', user?.id).maybeSingle();
    if (!studio) {
      alert('No studio found for this account.');
      setUploading(false);
      return;
    }

    const urls: string[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProgress(`Uploading ${i + 1} of ${fileArray.length}…`);
      const path = `${bookingId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('galleries').upload(path, file, { upsert: true });
      if (error) {
        alert(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('galleries').getPublicUrl(path);
      urls.push(publicUrl.publicUrl);
    }

    const { data: gallery, error: insertError } = await supabase
      .from('galleries')
      .insert({ studio_id: studio.id, booking_id: bookingId, photo_urls: urls })
      .select('id')
      .single();

    setUploading(false);
    setProgress('');

    if (insertError) {
      alert(`Uploaded photos but couldn't create the gallery record: ${insertError.message}`);
      return;
    }

    router.push('/galleries');
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">New gallery</h1>
      <p className="text-ink/60 mb-6">Upload the shoot's photos — you'll run AI culling and share the client link from the galleries list.</p>

      <div className="card p-6 max-w-lg space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink/50">Booking</label>
          <select className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm" value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
            <option value="">— select a booking —</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.leads?.clients?.name ?? 'Unknown'} — {new Date(b.shoot_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink/50">Photos</label>
          <input type="file" multiple accept="image/*" className="w-full text-sm mt-1" onChange={(e) => setFiles(e.target.files)} />
          {files && <p className="text-xs text-ink/40 mt-1">{files.length} file(s) selected</p>}
        </div>

        <button onClick={upload} disabled={uploading} className="bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
          {uploading ? progress || 'Uploading…' : 'Upload & create gallery'}
        </button>
      </div>
    </div>
  );
}
