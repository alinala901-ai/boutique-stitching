import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SalaryRecord, StitchingWorker } from '../../types';
import {
  fetchSalaryRecords,
  upsertSalaryRecord,
  deleteSalaryRecord,
  fetchStitchingWorkers,
} from '../../lib/supabase';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CreditCard,
  User,
  Calculator,
  Lock,
} from 'lucide-react';

export const SalaryManagement: React.FC = () => {
  const { language, formatText } = useLanguage();
  const { isAdmin, isStaff, userRole } = useAuth();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [workers, setWorkers] = useState<StitchingWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [monthYear, setMonthYear] = useState('October 2026');
  const [baseSalary, setBaseSalary] = useState('35000');
  const [bonus, setBonus] = useState('0');
  const [deduction, setDeduction] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partially Paid'>('Pending');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salData, workData] = await Promise.all([
        fetchSalaryRecords(),
        fetchStitchingWorkers(),
      ]);
      setRecords(salData);
      setWorkers(workData);
    } catch (err) {
      console.error('Failed to load salary records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);

  // Dynamic Net Payable Calculation: Base + Bonus - Deduction
  const calculatedFinalAmount = useMemo(() => {
    const base = parseFloat(baseSalary) || 0;
    const b = parseFloat(bonus) || 0;
    const d = parseFloat(deduction) || 0;
    return Math.max(0, base + b - d);
  }, [baseSalary, bonus, deduction]);

  // 5 Required Dashboard Summaries (Section 7)
  const stats = useMemo(() => {
    const totalPayroll = records.reduce((sum, r) => sum + Number(r.final_amount || 0), 0);
    const totalPaid = records
      .filter((r) => r.payment_status === 'Paid')
      .reduce((sum, r) => sum + Number(r.final_amount || 0), 0);

    const totalPending = records
      .filter((r) => r.payment_status === 'Pending')
      .reduce((sum, r) => sum + Number(r.final_amount || 0), 0);

    const totalBonuses = records.reduce((sum, r) => sum + Number(r.bonus || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + Number(r.deduction || 0), 0);

    return {
      totalPayroll,
      totalPaid,
      totalPending,
      totalBonuses,
      totalDeductions,
      workersCount: workers.length,
      recordsCount: records.length,
    };
  }, [records, workers]);

  const openAddModal = () => {
    setEditingRecord(null);
    setSelectedWorkerId(workers.length > 0 ? workers[0].id : '');
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setMonthYear(currentMonth);
    setBaseSalary('35000');
    setBonus('0');
    setDeduction('0');
    setPaymentStatus('Pending');
    setPaymentDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: SalaryRecord) => {
    setEditingRecord(rec);
    setSelectedWorkerId(rec.worker_id);
    setMonthYear(rec.month_year);
    setBaseSalary(String(rec.base_salary));
    setBonus(String(rec.bonus));
    setDeduction(String(rec.deduction));
    setPaymentStatus(rec.payment_status);
    setPaymentDate(rec.payment_date ? rec.payment_date.slice(0, 10) : '');
    setNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) return;

    setSaving(true);
    try {
      const payload: Partial<SalaryRecord> = {
        id: editingRecord ? editingRecord.id : undefined,
        worker_id: selectedWorkerId,
        month_year: monthYear.trim(),
        base_salary: parseFloat(baseSalary) || 0,
        bonus: parseFloat(bonus) || 0,
        deduction: parseFloat(deduction) || 0,
        final_amount: calculatedFinalAmount,
        payment_status: paymentStatus,
        payment_date: paymentDate || (paymentStatus === 'Paid' ? new Date().toISOString().slice(0, 10) : undefined),
        notes: notes.trim() || undefined,
      };

      const res = await upsertSalaryRecord(payload);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to save salary record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMarkPaid = async (rec: SalaryRecord) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updated: Partial<SalaryRecord> = {
        ...rec,
        payment_status: 'Paid',
        payment_date: today,
      };
      await upsertSalaryRecord(updated);
      setRecords((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, payment_status: 'Paid', payment_date: today } : r))
      );
    } catch (err) {
      console.error('Failed to mark salary paid:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteSalaryRecord(id);
      if (res.success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete salary record:', err);
    }
  };

  const filteredRecords = records.filter((r) => {
    const worker = workerMap.get(r.worker_id);
    const matchesSearch =
      !searchQuery ||
      (worker && worker.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.month_year.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.payment_status === statusFilter;
    const matchesMonth = monthFilter === 'all' || r.month_year === monthFilter;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const uniqueMonths = Array.from(new Set(records.map((r) => r.month_year)));

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl max-w-lg mx-auto shadow-sm my-12" dir={language === 'ur' ? 'rtl' : 'ltr'}>
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-serif-display font-semibold text-rose-950">
          {formatText('Administrator Access Required', 'ایڈمنسٹریٹر کی رسائی درکار ہے', 'Administrator Access Required')}
        </h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {formatText(
            'Salary and payroll management is restricted strictly to authorized studio administrators. Tailor wage records and staff compensation cannot be viewed by general staff or customers.',
            'تنخواہوں اور پے رول کا انتظام صرف مجاز ایڈمنسٹریٹر کے لیے مخصوص ہے۔ عملہ یا کسٹمرز یہ معلومات نہیں دیکھ سکتے۔',
            'Tankhwahon aur payroll ka record sirf authorized administrators dekh saktay hain. Staff ya customers ko ijazat nahi.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
        <div>
          <h2 className="text-xl font-serif-display font-bold text-blue-950">
            {language === 'ur' ? 'Karigar Tankhwahain Aur Ujrat Intizam' : 'Tailor & Staff Salaries Management'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-light">
            {language === 'ur'
              ? 'Cutting masters aur karigaron ki mahana tankhwah, bonuses aur adaigi ka record.'
              : 'Calculate monthly wages, track piece rates, bonuses, deductions, and payment slips.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ur' ? 'Naya Salary Slip' : 'Create Salary Slip'}</span>
        </button>
      </div>

      {/* Summary Cards: 5 Required Dashboard Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            {formatText('Total Payroll', 'کل ماہانہ پے رول', 'Total Monthly Payroll')}
          </p>
          <p className="text-xl font-serif-display font-bold text-blue-950 mt-1">
            PKR {stats.totalPayroll.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            {formatText('Total Paid', 'ادا شدہ تنخواہیں', 'Total Paid (Ada Shuda)')}
          </p>
          <p className="text-xl font-serif-display font-bold text-emerald-700 mt-1">
            PKR {stats.totalPaid.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            {formatText('Total Pending', 'واجب الادا تنخواہیں', 'Total Pending (Baqaya)')}
          </p>
          <p className="text-xl font-serif-display font-bold text-amber-800 mt-1">
            PKR {stats.totalPending.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            {formatText('Total Bonuses', 'کل بونس کی رقم', 'Total Bonuses')}
          </p>
          <p className="text-xl font-serif-display font-bold text-indigo-900 mt-1">
            PKR {stats.totalBonuses.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
            {formatText('Total Deductions', 'کل کٹوتی', 'Total Deductions')}
          </p>
          <p className="text-xl font-serif-display font-bold text-rose-800 mt-1">
            PKR {stats.totalDeductions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white border border-blue-100 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-3 text-[#9A8D7C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tailor name or month..."
            className="w-full ps-9 pe-3 py-2 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Paid Only</option>
            <option value="Pending">Pending Only</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>

        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
          >
            <option value="all">All Months</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Salaries Table */}
      {loading ? (
        <div className="py-16 text-center text-[#8C7E6D] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading salary records...</span>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-16 text-center bg-white border border-blue-100 rounded-xl p-8">
          <CreditCard className="w-12 h-12 text-[#C9BEAF] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No salary records found.</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[#F8F4EE] border-b border-blue-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-start">Worker / Tailor</th>
                  <th className="py-3 px-4 text-start">Month / Period</th>
                  <th className="py-3 px-4 text-start">Base / Fixed</th>
                  <th className="py-3 px-4 text-start">Bonus (+)</th>
                  <th className="py-3 px-4 text-start">Deduction (-)</th>
                  <th className="py-3 px-4 text-start">Net Payable</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {filteredRecords.map((rec) => {
                  const worker = workerMap.get(rec.worker_id);

                  return (
                    <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-950">
                          {worker ? worker.name : 'Unknown Staff'}
                        </span>
                        {worker?.specialization && (
                          <p className="text-[11px] text-blue-600">{worker.specialization}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{rec.month_year}</span>
                        {rec.payment_date && (
                          <p className="text-[10px] text-[#9A8D7C]">
                            Paid on: {rec.payment_date.slice(0, 10)}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">PKR {rec.base_salary.toLocaleString()}</td>

                      <td className="py-3 px-4 font-mono text-emerald-700">
                        {rec.bonus > 0 ? `+${rec.bonus.toLocaleString()}` : '-'}
                      </td>

                      <td className="py-3 px-4 font-mono text-red-600">
                        {rec.deduction > 0 ? `-${rec.deduction.toLocaleString()}` : '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sm text-blue-950">
                          PKR {rec.final_amount.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rec.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.payment_status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rec.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.payment_status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleQuickMarkPaid(rec)}
                              className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              title="Mark Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 text-blue-600 hover:bg-[#F0E8DC] rounded-md transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* MODAL: ADD / EDIT SALARY RECORD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-md w-full p-6 shadow-xl my-8 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              {editingRecord ? 'Update Salary Record' : 'Create Salary Record'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Formula: (Base/Piece Rate + Bonus - Deduction = Net Payable).
            </p>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tailor / Worker *
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Choose Worker --</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Salary Month / Period *
                </label>
                <input
                  type="text"
                  required
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Base / Fixed (PKR)
                  </label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bonus (+)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deduction (-)</label>
                  <input
                    type="number"
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Calculated Net Payable
                  </span>
                  <p className="text-[11px] text-slate-600">Base + Bonus - Deduction</p>
                </div>
                <span className="text-lg font-bold font-mono text-blue-600">
                  PKR {calculatedFinalAmount.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Eid advance adjusted, 10 suits stitched on piece rate..."
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
                  <span>Save Record</span>
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
            <h4 className="font-serif-display font-bold text-base text-blue-950">Delete Salary Record?</h4>
            <p className="text-xs text-slate-600">Are you sure you want to permanently delete this wage record?</p>
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
