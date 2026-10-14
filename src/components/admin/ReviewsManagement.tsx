import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CustomerReview } from '../../types';
import {
  fetchCustomerReviews,
  createCustomerReview,
  updateCustomerReview,
  deleteCustomerReview,
} from '../../lib/supabase';
import {
  Star,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Sparkles,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  AlertTriangle,
  User,
  MessageSquare,
} from 'lucide-react';

export const ReviewsManagement: React.FC = () => {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === 'Approved').length;
    const pending = reviews.filter((r) => r.status === 'Pending').length;
    const avg =
      total > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : '5.0';

    return { total, approved, pending, avg };
  }, [reviews]);

  const handleStatusChange = async (id: string, newStatus: CustomerReview['status']) => {
    try {
      await updateCustomerReview(id, { status: newStatus });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Failed to update review status:', err);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateCustomerReview(id, { is_featured: !current });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: !current } : r))
      );
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteCustomerReview(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) return;

    setSaving(true);
    try {
      const res = await createCustomerReview({
        customer_name: customerName.trim(),
        rating,
        review_text: reviewText.trim(),
      });
      if (res.success) {
        setIsModalOpen(false);
        setCustomerName('');
        setReviewText('');
        setRating(5);
        loadData();
      }
    } catch (err) {
      console.error('Failed to add review:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.review_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
        <div>
          <h2 className="text-xl font-serif-display font-bold text-blue-950">
            {language === 'ur' ? 'Customer Raaye Aur Reviews Intizam' : 'Customer Reviews & Testimonials'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-light">
            {language === 'ur'
              ? 'Muntakhib testimonials tasdeeq karein, ratings check karein aur featured mark karein.'
              : 'Moderate feedback, approve real customer testimonials, and highlight 5-star reviews on website.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ur' ? 'Walk-in Review Shamil Karein' : 'Add Walk-in Review'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Total Reviews</p>
          <p className="text-2xl font-serif-display font-bold text-blue-950 mt-1">{stats.total}</p>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Approved (Shaya Shuda)</p>
          <p className="text-2xl font-serif-display font-bold text-emerald-900 mt-1">{stats.approved}</p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pending Review</p>
          <p className="text-2xl font-serif-display font-bold text-amber-900 mt-1">{stats.pending}</p>
        </div>

        <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Average Rating</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-serif-display font-bold text-blue-600">{stats.avg}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-blue-100 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-3 text-[#9A8D7C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or testimonial keywords..."
            className="w-full ps-9 pe-3 py-2 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          >
            <option value="all">All Review Statuses</option>
            <option value="Approved">Approved Only</option>
            <option value="Pending">Pending Only</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#8C7E6D] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading reviews...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center bg-white border border-blue-100 rounded-xl p-8">
          <MessageSquare className="w-12 h-12 text-[#C9BEAF] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No customer reviews found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white border rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between ${
                rev.status === 'Approved'
                  ? 'border-[#E2D4BF]'
                  : rev.status === 'Pending'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-blue-100 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif-display font-bold text-base text-blue-950">
                      {rev.customer_name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      rev.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic bg-blue-50/30 p-3 rounded-lg border border-[#EDE2D4]">
                  "{rev.review_text}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#9A8D7C]">
                  <span>{rev.created_at ? rev.created_at.slice(0, 10) : 'Recent'}</span>
                  {rev.is_featured && (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured on Site</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F0E8DC]">
                <div className="flex items-center gap-1.5">
                  {rev.status !== 'Approved' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rev.id, 'Approved')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status !== 'Rejected' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rev.id, 'Rejected')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(rev.id, rev.is_featured)}
                    className={`p-1.5 rounded-md transition-colors ${
                      rev.is_featured ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'
                    }`}
                    title={rev.is_featured ? 'Remove from featured' : 'Feature on homepage'}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(rev.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              Add Customer Testimonial
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Record walk-in or WhatsApp feedback directly to the reviews catalog.
            </p>

            <form onSubmit={handleAddReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mrs. Farzana Sheikh (Sadiqabad)"
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rating</label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-blue-600 ms-2">{rating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Review Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="e.g. Bohot hi umda silai aur zabardast fitting! Waqt par suit tayar mil gaya..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFD3]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-[#F3EDE2] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h4 className="font-serif-display font-bold text-base text-blue-950">Delete Review?</h4>
            <p className="text-xs text-slate-600">Are you sure you want to permanently delete this testimonial?</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-[#F3EDE2] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
