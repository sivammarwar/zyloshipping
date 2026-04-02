'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const FOUNDER_EMAIL = 'shivamkumarsingh8544@gmail.com';

interface SocialAccount {
  id: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT';
  accountName: string;
  accountHandle: string;
  isActive: boolean;
  postsPerDay: number;
  followersCount: number;
  lastSyncedAt: string;
}

const platformConfig = {
  INSTAGRAM: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    description: 'Auto-post photos and reels to your Instagram business account',
    connectUrl: '/api/admin/social-media/connect/instagram',
    fields: ['accountHandle', 'accountName']
  },
  FACEBOOK: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    description: 'Auto-post to your Facebook page',
    connectUrl: '/api/admin/social-media/connect/facebook',
    fields: ['accountHandle', 'accountName']
  },
  TWITTER: {
    name: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2',
    description: 'Auto-post tweets and threads to your Twitter account',
    connectUrl: '/api/admin/social-media/connect/twitter',
    fields: ['accountHandle', 'accountName']
  },
  REDDIT: {
    name: 'Reddit',
    icon: '🔴',
    color: '#FF4500',
    description: 'Auto-post to subreddits (requires manual setup)',
    connectUrl: null,
    fields: ['accountHandle', 'accountName', 'accessToken']
  }
};

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--ink-muted)' }}>Loading...</div>
      </div>
    }>
      <SocialAccountsContent />
    </Suspense>
  );
}

function SocialAccountsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [showManualForm, setShowManualForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountHandle: '',
    accountName: '',
    accessToken: '',
    refreshToken: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check founder auth
    const founderToken = localStorage.getItem('founder_token');
    const founderEmail = localStorage.getItem('founder_email');
    
    if (!founderToken || founderEmail !== FOUNDER_EMAIL) {
      window.location.href = '/adminsiva/login';
      return;
    }

    // Check for OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success) {
      const platform = success.replace('_connected', '');
      setMessage(`✓ ${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
      setTimeout(() => setMessage(''), 5000);
    }
    if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_denied': 'Connection was cancelled',
        'no_page': 'No Facebook page found',
        'no_instagram': 'No Instagram business account linked to page',
        'instagram_failed': 'Instagram connection failed',
        'facebook_failed': 'Facebook connection failed',
        'twitter_failed': 'Twitter connection failed'
      };
      setMessage(`✗ ${errorMessages[error] || 'Connection failed'}`);
      setTimeout(() => setMessage(''), 5000);
    }

    fetchAccounts();
  }, [searchParams]);

  async function fetchAccounts() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/social-media/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualConnect(platform: string) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/social-media/connect/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform,
          ...formData
        })
      });

      if (res.ok) {
        setMessage(`✓ ${platformConfig[platform as keyof typeof platformConfig].name} connected!`);
        setShowManualForm(null);
        setFormData({ accountHandle: '', accountName: '', accessToken: '', refreshToken: '' });
        fetchAccounts();
      } else {
        setMessage('✗ Connection failed');
      }
    } catch (err) {
      setMessage('✗ Error connecting account');
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function toggleAccount(id: string, isActive: boolean) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/social-media/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to toggle account:', err);
    }
  }

  async function deleteAccount(id: string, platform: string) {
    if (!confirm(`Disconnect ${platform} account?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/social-media/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  }

  function handleLogout() {
    localStorage.removeItem('founder_token');
    localStorage.removeItem('founder_email');
    window.location.href = '/adminsiva/login';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          <Link href="/adminsiva" style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 900, color: 'white', textDecoration: 'none' }}>
            Zylo<span style={{ color: 'var(--red)' }}>.</span> <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Founder Panel</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {message && (
            <span style={{ fontSize: '0.8rem', color: message.startsWith('✓') ? '#22c55e' : '#ef4444' }}>{message}</span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>👑 {FOUNDER_EMAIL}</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/adminsiva" style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', textDecoration: 'none' }}>
            ← Back to Founder Panel
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              📱 Social Media Accounts
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>
              Connect your social accounts for AI-powered auto-posting
            </p>
          </div>
          <Link href="/adminsiva" style={{ padding: '0.75rem 1.5rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem', color: 'var(--ink)' }}>
            ← Back to Panel
          </Link>
        </div>

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--ink)' }}>
              Connected Accounts ({accounts.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {accounts.map((account) => {
                const config = platformConfig[account.platform];
                return (
                  <div key={account.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>{config.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{config.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>@{account.accountHandle}</div>
                      </div>
                      <span style={{ 
                        marginLeft: 'auto', 
                        padding: '0.25rem 0.75rem', 
                        background: account.isActive ? '#dcfce7' : '#fee2e2', 
                        color: account.isActive ? '#166534' : '#991b1b',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {account.isActive ? '● Active' : '○ Paused'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--off-white)', padding: '0.75rem', borderRadius: 4, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Followers</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{account.followersCount?.toLocaleString() ?? 0}</div>
                      </div>
                      <div style={{ background: 'var(--off-white)', padding: '0.75rem', borderRadius: 4, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Posts/Day</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{account.postsPerDay}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => toggleAccount(account.id, account.isActive)}
                        style={{ 
                          flex: 1, 
                          padding: '0.6rem', 
                          background: account.isActive ? '#fee2e2' : '#dcfce7', 
                          color: account.isActive ? '#991b1b' : '#166534',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        {account.isActive ? '⏸ Pause' : '▶ Resume'}
                      </button>
                      <button
                        onClick={() => deleteAccount(account.id, config.name)}
                        style={{ padding: '0.6rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connect New Account */}
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--ink)' }}>
          Connect New Account
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {Object.entries(platformConfig).map(([platform, config]) => {
            const existing = accounts.find(a => a.platform === platform);
            if (existing) return null; // Hide already connected platforms from this list
            
            return (
              <div key={platform} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{config.icon}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      {config.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', margin: 0 }}>
                      {config.description}
                    </p>
                  </div>
                </div>

                {config.connectUrl ? (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_BACKEND_URL}${config.connectUrl}`}
                    style={{ 
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem',
                      background: config.color,
                      color: 'white',
                      textAlign: 'center',
                      textDecoration: 'none',
                      borderRadius: 4,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Connect {config.name}
                  </a>
                ) : (
                  <button
                    onClick={() => setShowManualForm(platform)}
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      background: config.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Connect {config.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual Form Modal */}
        {showManualForm && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 100
          }}>
            <div style={{ background: 'var(--white)', borderRadius: 4, padding: '2rem', width: '100%', maxWidth: 400 }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                Connect {platformConfig[showManualForm as keyof typeof platformConfig].name}
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
                  Username/Handle
                </label>
                <input
                  type="text"
                  value={formData.accountHandle}
                  onChange={(e) => setFormData({ ...formData, accountHandle: e.target.value })}
                  placeholder="@username"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 2 }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Your Account Name"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 2 }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
                  Access Token / API Key
                </label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder="••••••••••••"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 2 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowManualForm(null)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleManualConnect(showManualForm)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
