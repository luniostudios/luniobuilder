'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Camera, Check, LoaderCircle, Mail, Shield, UserRound, X } from 'lucide-react';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

interface ProfileSettingsProps {
  user: ProfileData;
  onSaved: (user: ProfileData) => void;
}

export default function ProfileSettings({ user, onSaved }: ProfileSettingsProps) {
  const [name, setName] = useState(user.name || '');
  const [image, setImage] = useState(user.image || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/assets', { method: 'POST', body: formData });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error || 'Unable to upload your photo.');
    } else {
      setImage(data.asset.url);
    }
    setUploading(false);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, image: image || null }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error || 'Unable to save your profile.');
    } else {
      onSaved(data);
      setSuccess('Your profile has been updated.');
    }
    setSaving(false);
  };

  const avatar = image || 'https://www.gravatar.com/avatar?d=mp&f=y';

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Profile settings</h1>
        <p className="mt-1 text-gray-500">Update the details and photo shown across LUNIO Builder.</p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><Check size={16} />{success}</div>}

      <form onSubmit={saveProfile} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0">
            <img src={avatar} alt="Profile preview" className="h-20 w-20 rounded-full bg-gray-100 object-cover ring-4 ring-gray-50" />
            {image && <button type="button" onClick={() => setImage('')} aria-label="Remove profile photo" className="absolute -right-1 -top-1 rounded-full bg-gray-900 p-1.5 text-white hover:bg-gray-700"><X size={13} /></button>}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Profile photo</h2>
            <p className="mt-1 text-sm text-gray-500">Use a JPG, PNG, GIF, WebP, AVIF, or SVG up to 10 MB.</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Camera size={16} />}
              {uploading ? 'Uploading...' : 'Choose photo'}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml" onChange={uploadPhoto} disabled={uploading} className="sr-only" />
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700">Name</label>
          <div className="relative">
            <UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="profile-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} required className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="profile-email" value={user.email} disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Email changes are managed through your sign-in provider.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <span className="flex items-center gap-2"><Shield size={16} />Plan</span>
          <span className="font-semibold capitalize text-gray-900">{user.role.toLowerCase()}</span>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <LoaderCircle size={16} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
