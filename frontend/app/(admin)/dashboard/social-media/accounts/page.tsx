'use client';

import { useState, useEffect } from 'react';
import { Plus, Instagram, Facebook, Twitter, MessageSquare, Settings, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SocialMediaAccount {
  id: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT';
  accountName: string;
  accountHandle: string;
  isActive: boolean;
  targetRegion: string;
  postingTimezone: string;
  postsPerDay: number;
  followersCount: number;
  lastSyncedAt: string | null;
  createdAt: string;
}

const platformIcons = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  REDDIT: MessageSquare,
};

const platformColors = {
  INSTAGRAM: 'from-purple-500 to-pink-500',
  FACEBOOK: 'from-blue-600 to-blue-400',
  TWITTER: 'from-sky-500 to-blue-500',
  REDDIT: 'from-orange-600 to-red-500',
};

export default function SocialMediaAccountsPage() {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/social-media/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      await fetch(`/api/admin/social-media/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const toggleActive = async (accountId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/social-media/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to toggle account:', error);
    }
  };

  const getConnectedPlatforms = () => {
    return accounts.map(acc => acc.platform);
  };

  const availablePlatforms = ['INSTAGRAM', 'FACEBOOK', 'TWITTER'].filter(
    p => !getConnectedPlatforms().includes(p as any)
  ) as ('INSTAGRAM' | 'FACEBOOK' | 'TWITTER')[];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>Loading accounts...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--off-white)', minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem' }}>Social Media</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Accounts</h1>
          <p style={{ color: 'var(--ink-faint)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Connect and manage your social media platforms</p>
        </div>
        {availablePlatforms.length > 0 && (
          <button
            onClick={() => setShowConnectModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--red)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a01e3a'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
          >
            <Plus style={{ width: 20, height: 20 }} />
            Connect Account
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Connected Accounts</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{accounts.length}</div>
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Active Accounts</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
            {accounts.filter(a => a.isActive).length}
          </div>
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Total Followers</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>
            {accounts.reduce((sum, a) => sum + a.followersCount, 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Posts Per Day</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: '#9333ea', lineHeight: 1 }}>
            {accounts.reduce((sum, a) => sum + a.postsPerDay, 0)}
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'var(--off-white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Plus style={{ width: 32, height: 32, color: 'var(--ink-faint)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>No accounts connected</h3>
          <p style={{ color: 'var(--ink-faint)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Connect your first social media account to start automating posts</p>
          <button
            onClick={() => setShowConnectModal(true)}
            style={{ background: 'var(--red)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a01e3a'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
          >
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = platformIcons[account.platform];
            const gradient = platformColors[account.platform];

            return (
              <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Platform Header */}
                <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-8 h-8" />
                    <div className="flex items-center gap-2">
                      {account.isActive ? (
                        <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{account.accountName}</h3>
                  <p className="text-white/80 text-sm">@{account.accountHandle}</p>
                </div>

                {/* Account Details */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Followers</span>
                      <span className="font-semibold text-gray-900">
                        {account.followersCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target Region</span>
                      <span className="font-semibold text-gray-900">{account.targetRegion}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Posts Per Day</span>
                      <span className="font-semibold text-gray-900">{account.postsPerDay}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Timezone</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {account.postingTimezone.split('/')[1]}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(account.id, account.isActive)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        account.isActive
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {account.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Account Modal */}
      {showConnectModal && (
        <ConnectAccountModal
          availablePlatforms={availablePlatforms}
          onClose={() => {
            setShowConnectModal(false);
            setSelectedPlatform(null);
          }}
          onSuccess={() => {
            setShowConnectModal(false);
            setSelectedPlatform(null);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}

function ConnectAccountModal({
  availablePlatforms,
  onClose,
  onSuccess,
}: {
  availablePlatforms: ('INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT')[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT' | null>(null);
  const [formData, setFormData] = useState({
    accountName: '',
    accountHandle: '',
    accountId: '',
    accessToken: '',
    targetRegion: 'US',
    postsPerDay: 3,
  });
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!selectedPlatform) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/social-media/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          ...formData,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to connect account');
      }
    } catch (error) {
      console.error('Failed to connect account:', error);
      alert('Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Connect Social Media Account</h2>
          <p className="text-gray-600 mt-1">
            {step === 'select' ? 'Choose a platform to connect' : `Configure your ${selectedPlatform} account`}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlatforms.map((platform) => {
                const Icon = platformIcons[platform];
                const gradient = platformColors[platform];

                return (
                  <button
                    key={platform}
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setStep('configure');
                    }}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors text-center"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{platform}</h3>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="ZyloShipping"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Handle</label>
                <input
                  type="text"
                  value={formData.accountHandle}
                  onChange={(e) => setFormData({ ...formData, accountHandle: e.target.value })}
                  placeholder="zyloshipping"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedPlatform === 'INSTAGRAM' ? 'Business Account ID' : 
                   selectedPlatform === 'FACEBOOK' ? 'Page ID' : 'User ID'}
                </label>
                <input
                  type="text"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                <textarea
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder="Paste your long-lived access token here"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Region</label>
                  <select
                    value={formData.targetRegion}
                    onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Posts Per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.postsPerDay}
                    onChange={(e) => setFormData({ ...formData, postsPerDay: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">How to get credentials:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedPlatform === 'INSTAGRAM' && (
                    <>
                      <li>1. Go to developers.facebook.com</li>
                      <li>2. Create app → Add Instagram Graph API</li>
                      <li>3. Get long-lived access token</li>
                      <li>4. Get Instagram Business Account ID</li>
                    </>
                  )}
                  {selectedPlatform === 'FACEBOOK' && (
                    <>
                      <li>1. Go to developers.facebook.com</li>
                      <li>2. Create app → Add Facebook Pages API</li>
                      <li>3. Get page access token</li>
                      <li>4. Get Page ID from page settings</li>
                    </>
                  )}
                  {selectedPlatform === 'TWITTER' && (
                    <>
                      <li>1. Go to developer.twitter.com</li>
                      <li>2. Create app → Enable OAuth 2.0</li>
                      <li>3. Get bearer token</li>
                      <li>4. Get user ID from profile</li>
                    </>
                  )}
                  {selectedPlatform === 'REDDIT' && (
                    <>
                      <li>1. Go to reddit.com/prefs/apps</li>
                      <li>2. Create app (type: script)</li>
                      <li>3. Get client ID and secret</li>
                      <li>4. Use your Reddit username/password</li>
                      <li>5. Account Handle = target subreddit (e.g., "deals")</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {step === 'configure' && (
            <button
              onClick={handleConnect}
              disabled={loading || !formData.accountName || !formData.accessToken}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
