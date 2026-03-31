'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Edit, Trash2, TrendingUp, Calendar, Target, Zap } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  targetRegion: string;
  contentStyle: string;
  postsPerDay: number;
  productCount: number;
  startDate: string;
  endDate: string | null;
  nextRunAt: string | null;
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  account: {
    platform: string;
    accountHandle: string;
  };
  _count: {
    posts: number;
  };
}

const contentStyleLabels = {
  VIRAL_HOOK: 'Viral Hook',
  EDUCATIONAL: 'Educational',
  PROMOTIONAL: 'Promotional',
  STORYTELLING: 'Storytelling',
  TRENDING: 'Trending',
  CONTROVERSIAL: 'Controversial',
};

const contentStyleColors = {
  VIRAL_HOOK: 'bg-purple-100 text-purple-700',
  EDUCATIONAL: 'bg-blue-100 text-blue-700',
  PROMOTIONAL: 'bg-green-100 text-green-700',
  STORYTELLING: 'bg-pink-100 text-pink-700',
  TRENDING: 'bg-orange-100 text-orange-700',
  CONTROVERSIAL: 'bg-red-100 text-red-700',
};

export default function SocialMediaCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchAccounts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/social-media/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const toggleCampaign = async (campaignId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/social-media/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await fetch(`/api/admin/social-media/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.isActive).length,
    totalPosts: campaigns.reduce((sum, c) => sum + c.totalPosts, 0),
    totalEngagement: campaigns.reduce((sum, c) => sum + c.totalEngagement, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">Create and manage automated posting campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Campaigns</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Active Campaigns</div>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Posts</div>
              <div className="text-3xl font-bold text-purple-600">{stats.totalPosts}</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Engagement</div>
              <div className="text-3xl font-bold text-pink-600">{stats.totalEngagement.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first campaign to start automating posts</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600">{campaign.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.isActive ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <Play className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        <Pause className="w-3 h-3" />
                        Paused
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{campaign.account.platform}</span>
                  <span>•</span>
                  <span>@{campaign.account.accountHandle}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Content Style</div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${contentStyleColors[campaign.contentStyle as keyof typeof contentStyleColors]}`}>
                      {contentStyleLabels[campaign.contentStyle as keyof typeof contentStyleLabels]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Target Region</div>
                    <div className="font-semibold text-gray-900">{campaign.targetRegion}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Posts Per Day</div>
                    <div className="font-semibold text-gray-900">{campaign.postsPerDay}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Products</div>
                    <div className="font-semibold text-gray-900">{campaign.productCount}</div>
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{campaign.totalPosts}</div>
                      <div className="text-xs text-gray-600">Posts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{campaign.totalViews.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{campaign.totalEngagement.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Engagement</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCampaign(campaign.id, campaign.isActive)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      campaign.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {campaign.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          accounts={accounts}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  accounts,
  onClose,
  onSuccess,
}: {
  accounts: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    description: '',
    targetRegion: 'US',
    contentStyle: 'VIRAL_HOOK',
    postsPerDay: 3,
    productCount: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/social-media/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          endDate: formData.endDate || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
          <p className="text-gray-600 mt-1">Set up automated posting for your products</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Account *</label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an account</option>
              {accounts.filter(a => a.isActive).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.platform} - @{account.accountHandle}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="US Dropshipping Campaign"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Automated posts targeting US audience with viral content"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Region *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Style *</label>
              <select
                value={formData.contentStyle}
                onChange={(e) => setFormData({ ...formData, contentStyle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="VIRAL_HOOK">Viral Hook</option>
                <option value="EDUCATIONAL">Educational</option>
                <option value="PROMOTIONAL">Promotional</option>
                <option value="STORYTELLING">Storytelling</option>
                <option value="TRENDING">Trending</option>
                <option value="CONTROVERSIAL">Controversial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posts Per Day *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.postsPerDay}
                onChange={(e) => setFormData({ ...formData, postsPerDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products to Feature *</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.productCount}
                onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Campaign Details:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Posts will be automatically created and published 3x daily</li>
              <li>• Top {formData.productCount} trending products will be featured</li>
              <li>• Content will be optimized for {formData.targetRegion} audience</li>
              <li>• AI will generate {formData.contentStyle.toLowerCase().replace('_', ' ')} style content</li>
              <li>• Posts scheduled at optimal US times (7 AM, 12 PM, 6 PM EST)</li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.accountId || !formData.name}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
