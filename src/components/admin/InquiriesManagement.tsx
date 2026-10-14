import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ContactInquiry } from '../../types';
import {
  fetchContactInquiries,
  upsertContactInquiry,
  deleteContactInquiry,
} from '../../lib/supabase';
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

const INQUIRY_STATUSES = ['New', 'Read', 'Contacted', 'Resolved', 'Archived'] as const;

export const InquiriesManagement: React.FC = () => {
  const { language } = useLanguage();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail / Reply Modal
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [currentStatus, setCurrentStatus] = useState<ContactInquiry['status']>('New');
  const [savingInquiry, setSavingInquiry] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchContactInquiries();
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetailModal = (inq: ContactInquiry) => {
    setSelectedInquiry(inq);
    setInternalNote(inq.internal_note || '');
    setCurrentStatus(inq.status);
    // If it was New, automatically mark as Read
    if (inq.status === 'New') {
      upsertContactInquiry({ id: inq.id, status: 'Read' });
      setInquiries((prev) =>
        prev.map((i) => (i.id === inq.id ? { ...i, status: 'Read' } : i))
      );
    }
  };

  const handleSaveInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setSavingInquiry(true);
    try {
      const payload = {
        id: selectedInquiry.id,
        status: currentStatus,
        internal_note: internalNote.trim() || undefined,
      };

      const res = await upsertContactInquiry(payload);
      if (res.success) {
        setInquiries((prev) =>
          prev.map((i) => (i.id === selectedInquiry.id ? { ...i, ...payload } : i))
        );
        setSelectedInquiry(null);
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err);
    } finally {
      setSavingInquiry(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteContactInquiry(id);
      if (res.success) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  const getWhatsAppReplyUrl = (inq: ContactInquiry) => {
    const rawPhone = inq.phone.replace(/[^0-9]/g, '');
    let formatted = rawPhone;
    if (formatted.startsWith('03')) formatted = '92' + formatted.slice(1);
    const greeting = `Assalam-o-Alaikum ${inq.name}! Thank you for contacting Boutique Stitching (Sadiqabad). Regarding your inquiry: "${inq.message.slice(0, 80)}..." How may we assist you with your stitching consultation?`;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(greeting)}`;
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      !searchQuery ||
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.phone.includes(searchQuery) ||
      (inq.email && inq.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: ContactInquiry['status']) => {
    switch (st) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'Read':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Archived':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
        <div>
          <h2 className="text-xl font-serif-display font-bold text-blue-950">
            {language === 'ur' ? 'Rabta Aur Consultation Darkhwastain' : 'Contact & Consultation Inquiries'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-light">
            {language === 'ur'
              ? 'Website say anay wali sawalat, tailor appointments aur direct WhatsApp replies.'
              : 'Direct customer messages from website form with 1-click WhatsApp replying.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-50/30 border border-blue-100 rounded-lg text-xs font-semibold text-slate-600">
            Total Inquiries:{' '}
            <span className="font-bold text-blue-600">{inquiries.length}</span>
          </div>
          {inquiries.filter((i) => i.status === 'New').length > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white">
              {inquiries.filter((i) => i.status === 'New').length} New
            </span>
          )}
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
            placeholder="Search customer name, phone, message..."
            className="w-full ps-9 pe-3 py-2 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          >
            <option value="all">All Inquiry Statuses</option>
            {INQUIRY_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      {loading ? (
        <div className="py-16 text-center text-[#8C7E6D] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading inquiries...</span>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="py-16 text-center bg-white border border-blue-100 rounded-xl p-8">
          <MessageSquare className="w-12 h-12 text-[#C9BEAF] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No contact inquiries found.</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[#F8F4EE] border-b border-blue-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-start">Customer</th>
                  <th className="py-3 px-4 text-start">Contact Details</th>
                  <th className="py-3 px-4 text-start">Message</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-start">Date</th>
                  <th className="py-3 px-4 text-end">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-950">{inq.name}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-mono text-blue-950 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#9A8D7C]" />
                          <span>{inq.phone}</span>
                        </p>
                        {inq.email && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#9A8D7C]" />
                            <span>{inq.email}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {inq.message}
                      </p>
                      {inq.internal_note && (
                        <p className="text-[10px] text-blue-600 italic mt-0.5">
                          Note: {inq.internal_note}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${getStatusBadge(
                          inq.status
                        )}`}
                      >
                        {inq.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {inq.created_at ? inq.created_at.slice(0, 10) : 'Today'}
                    </td>

                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getWhatsAppReplyUrl(inq)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                          title="Reply on WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => openDetailModal(inq)}
                          className="p-1.5 text-blue-600 hover:bg-[#F0E8DC] rounded-md transition-colors"
                          title="View / Note"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(inq.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL / UPDATE MODAL */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              Customer Inquiry Details
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              From: <span className="font-semibold text-blue-950">{selectedInquiry.name}</span>
            </p>

            <form onSubmit={handleSaveInquiry} className="space-y-3.5">
              <div className="p-3 bg-blue-50/30 rounded-xl border border-[#EDE2D4] space-y-2 text-xs">
                <p>
                  <strong>Phone:</strong> {selectedInquiry.phone}
                </p>
                {selectedInquiry.email && (
                  <p>
                    <strong>Email:</strong> {selectedInquiry.email}
                  </p>
                )}
                <div>
                  <strong>Customer Message:</strong>
                  <p className="mt-1 text-slate-700 italic bg-white p-2.5 rounded border border-blue-100">
                    "{selectedInquiry.message}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                >
                  {INQUIRY_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Internal Follow-up Note
                </label>
                <textarea
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="e.g. Called customer at 3pm, confirmed lawn suit stitching with custom laces..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#E8DFD3]">
                <a
                  href={getWhatsAppReplyUrl(selectedInquiry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-[#F3EDE2] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInquiry}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2"
                  >
                    {savingInquiry && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h4 className="font-serif-display font-bold text-base text-blue-950">Delete Inquiry?</h4>
            <p className="text-xs text-slate-600">Are you sure you want to remove this customer inquiry?</p>
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
