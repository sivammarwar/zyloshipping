'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Instagram, Facebook, Twitter, MessageSquare, Calendar, Download } from 'lucide-react';

interface Analytics {
  date: string;
  platform: string;
  postsPublished: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  followersGained: number;
  engagementRate: number;
}

interface TopPost {
  id: string;
  platform: string;
  caption: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement: number;
  platformUrl: string | null;
  publishedAt: string;
  account: {
    accountHandle: string;
  };
}

const platformIcons = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  REDDIT: MessageSquare,
};

const platformColors = {
  INSTAGRAM: '#E4405F',
  FACEBOOK: '#1877F2',
  TWITTER: '#1DA1F2',
  REDDIT: '#FF4500',
};

export default function SocialMediaAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchTopPosts();
  }, [timeRange, selectedPlatform]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      params.append('days', timeRange.toString());
      if (selectedPlatform) params.append('platform', selectedPlatform);

      const res = await fetch(`/api/admin/social-media/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchTopPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('days', timeRange.toString());
      params.append('limit', '10');

      const res = await fetch(`/api/admin/social-media/analytics/top-posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setTopPosts(data.topPosts || []);
    } catch (error) {
      console.error('Failed to fetch top posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = analytics.reduce(
    (acc, day) => ({
      postsPublished: acc.postsPublished + day.postsPublished,
      totalViews: acc.totalViews + day.totalViews,
      totalLikes: acc.totalLikes + day.totalLikes,
      totalComments: acc.totalComments + day.totalComments,
      totalShares: acc.totalShares + day.totalShares,
      totalReach: acc.totalReach + day.totalReach,
      followersGained: acc.followersGained + day.followersGained,
    }),
    {
      postsPublished: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      followersGained: 0,
    }
  );

  const avgEngagementRate = analytics.length > 0
    ? analytics.reduce((sum, day) => sum + day.engagementRate, 0) / analytics.length
    : 0;

  // Platform breakdown
  const platformStats = analytics.reduce((acc, day) => {
    if (!acc[day.platform]) {
      acc[day.platform] = {
        posts: 0,
        views: 0,
        engagement: 0,
      };
    }
    acc[day.platform].posts += day.postsPublished;
    acc[day.platform].views += day.totalViews;
    acc[day.platform].engagement += day.totalLikes + day.totalComments + day.totalShares;
    return acc;
  }, {} as Record<string, { posts: number; views: number; engagement: number }>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your social media performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TWITTER">Twitter</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Reach"
          value={totals.totalReach.toLocaleString()}
          icon={Eye}
          color="blue"
          trend="+12.5%"
        />
        <MetricCard
          title="Total Engagement"
          value={(totals.totalLikes + totals.totalComments + totals.totalShares).toLocaleString()}
          icon={Heart}
          color="pink"
          trend="+8.3%"
        />
        <MetricCard
          title="Followers Gained"
          value={totals.followersGained.toLocaleString()}
          icon={Users}
          color="green"
          trend="+15.2%"
        />
        <MetricCard
          title="Avg Engagement Rate"
          value={`${avgEngagementRate.toFixed(2)}%`}
          icon={TrendingUp}
          color="purple"
          trend="+3.1%"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Posts Published</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{totals.postsPublished}</div>
          <div className="text-sm text-gray-600">
            {(totals.postsPublished / timeRange).toFixed(1)} posts per day
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Views</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{totals.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">
            {(totals.totalViews / totals.postsPublished || 0).toFixed(0)} avg per post
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Engagement</h3>
            <Heart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Likes</span>
              <span className="font-semibold text-gray-900">{totals.totalLikes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Comments</span>
              <span className="font-semibold text-gray-900">{totals.totalComments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shares</span>
              <span className="font-semibold text-gray-900">{totals.totalShares.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Comparison */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h3 className="font-semibold text-gray-900 mb-6">Platform Performance</h3>
        <div className="space-y-6">
          {Object.entries(platformStats).map(([platform, stats]) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons];
            const color = platformColors[platform as keyof typeof platformColors];
            const engagementRate = stats.views > 0 ? (stats.engagement / stats.views) * 100 : 0;

            return (
              <div key={platform}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{platform}</div>
                      <div className="text-sm text-gray-600">{stats.posts} posts</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{stats.views.toLocaleString()} views</div>
                    <div className="text-sm text-gray-600">{engagementRate.toFixed(2)}% engagement</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((stats.views / totals.totalViews) * 100, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Top Performing Posts</h3>
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : topPosts.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No posts data available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topPosts.map((post, index) => {
              const Icon = platformIcons[post.platform as keyof typeof platformIcons];
              const totalEngagement = post.likes + post.comments + post.shares;

              return (
                <div key={post.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>

                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <img
                      src={post.mediaUrls[0]}
                      alt="Post"
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">@{post.account.accountHandle}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2 mb-2">{post.caption.split('\n')[0]}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {post.shares.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-purple-600">{post.engagement.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">engagement</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Engagement Trend Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-8">
        <h3 className="font-semibold text-gray-900 mb-6">Engagement Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">Chart visualization coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Install chart library for detailed trends</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    pink: 'bg-pink-100 text-pink-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm font-medium text-green-600">{trend}</span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
