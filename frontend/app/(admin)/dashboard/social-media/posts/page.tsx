'use client';

import { useState, useEffect } from 'react';
import { Filter, Eye, Trash2, ExternalLink, TrendingUp, Heart, MessageCircle, Share2, BarChart3, Instagram, Facebook, Twitter, MessageSquare } from 'lucide-react';

interface SocialMediaPost {
  id: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'REDDIT';
  postType: string;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTING' | 'PUBLISHED' | 'FAILED';
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  platformUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  publishedAt: string | null;
  createdAt: string;
  account: {
    platform: string;
    accountHandle: string;
  };
  campaign: {
    name: string;
  } | null;
}

const platformIcons = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  REDDIT: MessageSquare,
};

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  POSTING: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  DELETED: 'bg-gray-100 text-gray-500',
};

export default function SocialMediaPostsPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page.toString());

      const res = await fetch(`/api/admin/social-media/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await fetch(`/api/admin/social-media/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const stats = {
    total: pagination.total,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
    failed: posts.filter(p => p.status === 'FAILED').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Social Media Posts</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all your automated posts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Posts</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Published</div>
              <div className="text-3xl font-bold text-green-600">{stats.published}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Scheduled</div>
              <div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.platform}
            onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TWITTER">Twitter</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="FAILED">Failed</option>
            <option value="DRAFT">Draft</option>
          </select>

          <button
            onClick={() => setFilters({ platform: '', status: '', page: 1 })}
            className="ml-auto text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600">Posts will appear here once campaigns start running</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => {
                    const Icon = platformIcons[post.platform];
                    return (
                      <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                              <img
                                src={post.mediaUrls[0]}
                                alt="Post media"
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {post.caption.split('\n')[0]}
                              </p>
                              {post.campaign && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Campaign: {post.campaign.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-900">{post.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[post.status]}`}>
                            {post.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {post.status === 'PUBLISHED' ? (
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <Share2 className="w-4 h-4" />
                                <span>{post.shares.toLocaleString()}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString()
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPost(post)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {post.platformUrl && (
                              <a
                                href={post.platformUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View on Platform"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailsModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

function PostDetailsModal({ post, onClose }: { post: SocialMediaPost; onClose: () => void }) {
  const Icon = platformIcons[post.platform];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6 text-gray-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{post.platform} Post</h2>
                <p className="text-sm text-gray-600">@{post.account.accountHandle}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[post.status]}`}>
              {post.status}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {post.mediaUrls.slice(0, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Caption */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Caption</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{post.caption}</p>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          {post.status === 'PUBLISHED' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Views</div>
                  <div className="text-2xl font-bold text-gray-900">{post.views.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Likes</div>
                  <div className="text-2xl font-bold text-pink-600">{post.likes.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Comments</div>
                  <div className="text-2xl font-bold text-blue-600">{post.comments.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Shares</div>
                  <div className="text-2xl font-bold text-green-600">{post.shares.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-4 bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">Engagement Rate</div>
                <div className="text-3xl font-bold text-purple-600">{post.engagement.toFixed(2)}%</div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-600">Post Type</div>
              <div className="font-medium text-gray-900">{post.postType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Campaign</div>
              <div className="font-medium text-gray-900">{post.campaign?.name || 'None'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created</div>
              <div className="font-medium text-gray-900">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
            {post.publishedAt && (
              <div>
                <div className="text-sm text-gray-600">Published</div>
                <div className="font-medium text-gray-900">
                  {new Date(post.publishedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Platform Link */}
          {post.platformUrl && (
            <a
              href={post.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              View on {post.platform}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
