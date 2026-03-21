import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User } from '@/types/models';

const PARENT_TITLE_OPTIONS = ['Mum', 'Mom', 'Dad', 'Papa', 'Pop', 'Nana', 'Grandma', 'Grandpa', 'Carer'];

function deriveDropdownValue(title: string | null): string {
  if (!title) return '';
  if (PARENT_TITLE_OPTIONS.includes(title)) return title;
  return '__custom__';
}

interface Props {
  user: User;
}

export default function SettingsIndex({ user }: Props) {
  const [parentTitleDropdown, setParentTitleDropdown] = useState(deriveDropdownValue(user.parent_title));
  const [customTitle, setCustomTitle] = useState(
    user.parent_title && !PARENT_TITLE_OPTIONS.includes(user.parent_title) ? user.parent_title : ''
  );

  const profileForm = useForm({
    display_name: user.display_name ?? '',
    parent_title: user.parent_title ?? '',
    email: user.email,
    avatar_url: user.avatar_url ?? '',
  });

  function handleDropdownChange(value: string) {
    setParentTitleDropdown(value);
    if (value !== '__custom__') {
      profileForm.setData('parent_title', value);
    } else {
      profileForm.setData('parent_title', customTitle);
    }
  }

  function handleCustomTitleChange(value: string) {
    setCustomTitle(value);
    profileForm.setData('parent_title', value);
  }

  const deleteForm = useForm({ password: '' });

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    profileForm.patch(route('settings.profile.update'));
  }

  function submitDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm('Are you sure? This will permanently delete your account and all family data you own. This cannot be undone.')) {
      return;
    }
    deleteForm.delete(route('settings.account.destroy'));
  }

  function exportData(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = route('settings.export');
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Settings</h2>}>
      <Head title="Settings" />
      <div className="py-8 max-w-2xl mx-auto px-4 space-y-8">

        {/* Profile section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h3>
          <form onSubmit={submitProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name <span className="text-gray-400">(shown to family members)</span>
              </label>
              <input
                type="text"
                value={profileForm.data.display_name}
                onChange={e => profileForm.setData('display_name', e.target.value)}
                placeholder={user.name}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
              {profileForm.errors.display_name && (
                <p className="text-red-500 text-xs mt-1">{profileForm.errors.display_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What do your kids call you? <span className="text-gray-400">(shown on kid pages)</span>
              </label>
              <select
                value={parentTitleDropdown}
                onChange={e => handleDropdownChange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— not set —</option>
                {PARENT_TITLE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
              {parentTitleDropdown === '__custom__' && (
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => handleCustomTitleChange(e.target.value)}
                  placeholder="e.g. Oma, Père, Baba…"
                  className="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              )}
              {profileForm.errors.parent_title && (
                <p className="text-red-500 text-xs mt-1">{profileForm.errors.parent_title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={profileForm.data.email}
                onChange={e => profileForm.setData('email', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
              {profileForm.errors.email && (
                <p className="text-red-500 text-xs mt-1">{profileForm.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avatar URL <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={profileForm.data.avatar_url}
                onChange={e => profileForm.setData('avatar_url', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
              {profileForm.errors.avatar_url && (
                <p className="text-red-500 text-xs mt-1">{profileForm.errors.avatar_url}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileForm.processing}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {profileForm.processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {profileForm.recentlySuccessful && (
              <p className="text-green-600 text-sm text-right">Saved.</p>
            )}
          </form>
        </section>

        {/* Danger zone */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-red-200 dark:border-red-900">
          <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            {/* Export data */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Export My Data</p>
                <p className="text-xs text-gray-400">Download a copy of all your account data as JSON.</p>
              </div>
              <button
                onClick={exportData}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export
              </button>
            </div>

            {/* Delete account */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Delete Account</p>
              <p className="text-xs text-gray-400 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <form onSubmit={submitDelete} className="flex gap-3">
                <input
                  type="password"
                  value={deleteForm.data.password}
                  onChange={e => deleteForm.setData('password', e.target.value)}
                  placeholder="Confirm your password"
                  className="flex-1 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={deleteForm.processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                >
                  Delete Account
                </button>
              </form>
              {deleteForm.errors.password && (
                <p className="text-red-500 text-xs mt-1">{deleteForm.errors.password}</p>
              )}
            </div>
          </div>
        </section>

      </div>
    </AuthenticatedLayout>
  );
}
