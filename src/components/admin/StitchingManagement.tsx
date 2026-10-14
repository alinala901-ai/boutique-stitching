import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  StitchingJob,
  StitchingWorker,
  StitchingOrder,
  StitchingJobStatus,
  JobPriority,
  WorkerSpecialization,
} from '../../types';
import {
  fetchStitchingJobs,
  upsertStitchingJob,
  fetchStitchingWorkers,
  upsertStitchingWorker,
  deleteWorker,
  fetchOrders,
  updateOrderStatus,
} from '../../lib/supabase';
import {
  Scissors,
  Users,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Ruler,
  Eye,
  FileText,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const SPECIALIZATIONS: WorkerSpecialization[] = [
  'Ladies Stitching',
  'Kids Stitching',
  'Bridal',
  'Embroidery',
  'Alterations',
  'Cutting',
  'Finishing',
  'Custom Design',
];

const JOB_STATUSES: StitchingJobStatus[] = [
  'New',
  'Pending',
  'Assigned',
  'Cutting',
  'Stitching',
  'Finishing',
  'Ready',
  'Delivered',
  'Cancelled',
];

const PRIORITIES: JobPriority[] = ['low', 'medium', 'high', 'urgent'];

export const StitchingManagement: React.FC = () => {
  const { language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'workers'>('jobs');

  // Jobs State
  const [jobs, setJobs] = useState<StitchingJob[]>([]);
  const [workers, setWorkers] = useState<StitchingWorker[]>([]);
  const [orders, setOrders] = useState<StitchingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Job Assignment / Edit Modal
  const [editingJob, setEditingJob] = useState<StitchingJob | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<JobPriority>('medium');
  const [selectedJobStatus, setSelectedJobStatus] = useState<StitchingJobStatus>('Assigned');
  const [expectedDate, setExpectedDate] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [savingJob, setSavingJob] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // Worker Modal
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<StitchingWorker | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerSpec, setWorkerSpec] = useState<WorkerSpecialization>('Ladies Stitching');
  const [workerStatus, setWorkerStatus] = useState<'active' | 'inactive' | 'on_leave'>('active');
  const [workerJoiningDate, setWorkerJoiningDate] = useState('');
  const [workerNotes, setWorkerNotes] = useState('');
  const [savingWorker, setSavingWorker] = useState(false);
  const [workerDeleteConfirmId, setWorkerDeleteConfirmId] = useState<string | null>(null);

  // Measurements / Image Modal
  const [viewingMeasurementsOrder, setViewingMeasurementsOrder] = useState<StitchingOrder | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [jobsData, workersData, ordersData] = await Promise.all([
        fetchStitchingJobs(),
        fetchStitchingWorkers(),
        fetchOrders(),
      ]);
      setJobs(jobsData);
      setWorkers(workersData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to load stitching management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Open Create Job Modal
  const openNewJobModal = (orderId?: string) => {
    setEditingJob(null);
    setSelectedOrderId(orderId || (orders.length > 0 ? orders[0].id : ''));
    setSelectedWorkerId(workers.length > 0 ? workers[0].id : '');
    setSelectedPriority('medium');
    setSelectedJobStatus('Assigned');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExpectedDate(defaultDate.toISOString().slice(0, 10));
    setJobNotes('');
    setIsJobModalOpen(true);
  };

  const openEditJobModal = (job: StitchingJob) => {
    setEditingJob(job);
    setSelectedOrderId(job.order_id);
    setSelectedWorkerId(job.worker_id || '');
    setSelectedPriority(job.priority);
    setSelectedJobStatus(job.stitching_status);
    setExpectedDate(job.expected_completion_date ? job.expected_completion_date.slice(0, 10) : '');
    setJobNotes(job.stitching_notes || '');
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    setSavingJob(true);
    try {
      const payload: Partial<StitchingJob> = {
        id: editingJob ? editingJob.id : undefined,
        order_id: selectedOrderId,
        worker_id: selectedWorkerId || null,
        priority: selectedPriority,
        stitching_status: selectedJobStatus,
        expected_completion_date: expectedDate || undefined,
        stitching_notes: jobNotes.trim() || undefined,
      };

      const res = await upsertStitchingJob(payload);
      if (res.success) {
        // Also sync corresponding stitching order status if applicable
        if (selectedJobStatus === 'Ready') {
          await updateOrderStatus(selectedOrderId, 'ready');
        } else if (['Cutting', 'Stitching', 'Finishing'].includes(selectedJobStatus)) {
          await updateOrderStatus(selectedOrderId, 'in_progress');
        } else if (selectedJobStatus === 'Delivered') {
          await updateOrderStatus(selectedOrderId, 'completed');
        }

        setIsJobModalOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error('Failed to save stitching job:', err);
    } finally {
      setSavingJob(false);
    }
  };

  // Worker Form Handlers
  const openAddWorkerModal = () => {
    setEditingWorker(null);
    setWorkerName('');
    setWorkerPhone('');
    setWorkerSpec('Ladies Stitching');
    setWorkerStatus('active');
    setWorkerJoiningDate(new Date().toISOString().slice(0, 10));
    setWorkerNotes('');
    setIsWorkerModalOpen(true);
  };

  const openEditWorkerModal = (worker: StitchingWorker) => {
    setEditingWorker(worker);
    setWorkerName(worker.name);
    setWorkerPhone(worker.phone || '');
    setWorkerSpec(worker.specialization);
    setWorkerStatus(worker.status);
    setWorkerJoiningDate(worker.joining_date ? worker.joining_date.slice(0, 10) : '');
    setWorkerNotes(worker.notes || '');
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) return;

    setSavingWorker(true);
    try {
      const payload: Partial<StitchingWorker> = {
        id: editingWorker ? editingWorker.id : undefined,
        name: workerName.trim(),
        phone: workerPhone.trim() || undefined,
        specialization: workerSpec,
        status: workerStatus,
        joining_date: workerJoiningDate || new Date().toISOString().slice(0, 10),
        notes: workerNotes.trim() || undefined,
      };

      const res = await upsertStitchingWorker(payload);
      if (res.success) {
        setIsWorkerModalOpen(false);
        loadAllData();
      }
    } catch (err) {
      console.error('Failed to save worker:', err);
    } finally {
      setSavingWorker(false);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      const res = await deleteWorker(id);
      if (res.success) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
        setWorkerDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete worker:', err);
    }
  };

  // Helper mapping for orders and workers
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const filteredJobs = jobs.filter((job) => {
    const order = orderMap.get(job.order_id);
    const worker = job.worker_id ? workerMap.get(job.worker_id) : null;

    const matchesSearch =
      !searchQuery ||
      (order && order.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (worker && worker.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || job.stitching_status === statusFilter;
    const matchesWorker = workerFilter === 'all' || job.worker_id === workerFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesWorker && matchesPriority;
  });

  const getPriorityBadge = (p: JobPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getJobStatusBadge = (s: StitchingJobStatus) => {
    switch (s) {
      case 'New':
        return 'bg-amber-100 text-amber-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'Cutting':
        return 'bg-indigo-100 text-indigo-800';
      case 'Stitching':
        return 'bg-purple-100 text-purple-800';
      case 'Finishing':
        return 'bg-teal-100 text-teal-800';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'Delivered':
        return 'bg-green-100 text-green-900';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
        <div>
          <h2 className="text-xl font-serif-display font-bold text-blue-950">
            {language === 'ur' ? 'Silai Kaam Aur Karigar Intizam' : 'Stitching & Tailor Management'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-light">
            {language === 'ur'
              ? 'Silai jobs, cutting masters, karigaron ki taayenati aur kaam ki taaza tareen soorat-e-haal.'
              : 'Track active stitching workflows, assign specialized tailors, monitor cutting/embroidery stages and expected delivery dates.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#F0E8DC] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('jobs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'jobs'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'Silai Jobs' : 'Stitching Jobs'}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-[#E5DACB] rounded-full">
                  {jobs.length}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('workers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'workers'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'Karigar / Tailors' : 'Workers & Tailors'}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-[#E5DACB] rounded-full">
                  {workers.length}
                </span>
              </span>
            </button>
          </div>

          {activeSubTab === 'jobs' ? (
            <button
              type="button"
              onClick={() => openNewJobModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ur' ? 'Job Taayen Karein' : 'Assign Job'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddWorkerModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ur' ? 'Naya Karigar Shamil Karein' : 'Add Tailor'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STITCHING JOBS */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-white border border-blue-100 rounded-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-3 text-[#9A8D7C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ur' ? 'Order, customer ya karigar talash karein...' : 'Search order, customer, or tailor...'}
                className="w-full ps-9 pe-3 py-2 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
              >
                <option value="all">{language === 'ur' ? 'Tamam Status' : 'All Statuses'}</option>
                {JOB_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
              >
                <option value="all">{language === 'ur' ? 'Tamam Karigar' : 'All Tailors'}</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
              >
                <option value="all">{language === 'ur' ? 'Tamam Priorities' : 'All Priorities'}</option>
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr} className="capitalize">
                    {pr.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Jobs Listing Table */}
          {loading ? (
            <div className="py-16 text-center text-[#8C7E6D] flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm">{language === 'ur' ? 'Silai jobs load ho rahi hain...' : 'Loading stitching jobs...'}</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center bg-white border border-blue-100 rounded-xl p-8">
              <Scissors className="w-12 h-12 text-[#C9BEAF] mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                {language === 'ur' ? 'Koi silai job nahi mili.' : 'No stitching jobs found.'}
              </p>
              <p className="text-xs text-[#8C7E6D] mt-1 font-light">
                {language === 'ur'
                  ? 'Orders ko karigar assign karein ya search filters tabdeel karein.'
                  : 'Assign incoming stitching orders to master tailors to start tracking.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-[#F8F4EE] border-b border-blue-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 text-start">Order & Customer</th>
                      <th className="py-3 px-4 text-start">Assigned Tailor</th>
                      <th className="py-3 px-4 text-start">Service & Design</th>
                      <th className="py-3 px-4 text-start">Priority</th>
                      <th className="py-3 px-4 text-start">Stitching Status</th>
                      <th className="py-3 px-4 text-start">Expected Completion</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E8DC]">
                    {filteredJobs.map((job) => {
                      const order = orderMap.get(job.order_id);
                      const worker = job.worker_id ? workerMap.get(job.worker_id) : null;

                      return (
                        <tr key={job.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-mono font-bold text-blue-600">
                                {order?.order_number || job.order_id.slice(0, 8)}
                              </span>
                              <p className="font-medium text-blue-950 mt-0.5">
                                {order?.customer_name || 'Walk-in Customer'}
                              </p>
                              {order?.phone && (
                                <p className="text-[11px] text-slate-600 font-mono">{order.phone}</p>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {worker ? (
                              <div>
                                <span className="font-semibold text-blue-950">{worker.name}</span>
                                <p className="text-[11px] text-blue-600 font-medium">{worker.specialization}</p>
                              </div>
                            ) : (
                              <span className="text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium text-slate-900">
                                {order?.service_type || 'Custom Stitching'}
                              </span>
                              <p className="text-[11px] text-slate-600 capitalize">
                                {order?.category || 'Pakistani Suit'}
                              </p>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${getPriorityBadge(
                                job.priority
                              )}`}
                            >
                              {job.priority}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getJobStatusBadge(
                                job.stitching_status
                              )}`}
                            >
                              {job.stitching_status}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-[#9A8D7C]" />
                              <span>{job.expected_completion_date ? job.expected_completion_date.slice(0, 10) : 'Not specified'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              {order && (
                                <button
                                  type="button"
                                  onClick={() => setViewingMeasurementsOrder(order)}
                                  className="p-1.5 text-slate-600 hover:text-blue-950 hover:bg-[#F0E8DC] rounded-md transition-colors"
                                  title="View Measurements"
                                >
                                  <Ruler className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditJobModal(job)}
                                className="p-1.5 text-blue-600 hover:text-[#73572E] hover:bg-[#F0E8DC] rounded-md transition-colors"
                                title="Update Job"
                              >
                                <Edit2 className="w-4 h-4" />
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
        </div>
      )}

      {/* SUB-TAB 2: WORKERS & TAILORS */}
      {activeSubTab === 'workers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => {
              const assignedCount = jobs.filter(
                (j) => j.worker_id === worker.id && !['Delivered', 'Cancelled'].includes(j.stitching_status)
              ).length;
              const completedCount = jobs.filter(
                (j) => j.worker_id === worker.id && j.stitching_status === 'Delivered'
              ).length;

              return (
                <div
                  key={worker.id}
                  className="bg-white border border-blue-100 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif-display font-bold text-base text-blue-950">
                          {worker.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 mt-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-600 border border-[#E5D7C3]">
                          {worker.specialization}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          worker.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : worker.status === 'on_leave'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {worker.status.replace('_', ' ')}
                      </span>
                    </div>

                    {worker.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#9A8D7C]" />
                        <span className="font-mono">{worker.phone}</span>
                      </p>
                    )}

                    {worker.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2 font-light leading-relaxed">
                        {worker.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F0E8DC] text-center">
                      <div className="p-2 bg-blue-50/30 rounded-lg">
                        <p className="text-[10px] text-slate-600 uppercase font-semibold">Active Jobs</p>
                        <p className="text-base font-bold text-blue-600">{assignedCount}</p>
                      </div>
                      <div className="p-2 bg-blue-50/30 rounded-lg">
                        <p className="text-[10px] text-slate-600 uppercase font-semibold">Delivered</p>
                        <p className="text-base font-bold text-emerald-700">{completedCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F0E8DC]">
                    <span className="text-[10px] text-[#9A8D7C]">
                      Joined: {worker.joining_date ? worker.joining_date.slice(0, 10) : '2026'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditWorkerModal(worker)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Worker"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkerDeleteConfirmId(worker.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN / UPDATE STITCHING JOB */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 relative">
            <button
              type="button"
              onClick={() => setIsJobModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              {editingJob ? 'Update Stitching Job' : 'Assign New Stitching Job'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Assign master tailor, define stage progress, and set delivery deadlines.
            </p>

            <form onSubmit={handleSaveJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Stitching Order *
                </label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.order_number} · {ord.customer_name} ({ord.service_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assign Tailor / Worker
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Leave Unassigned --</option>
                  {workers
                    .filter((w) => w.status === 'active')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.specialization})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as JobPriority)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    {PRIORITIES.map((pr) => (
                      <option key={pr} value={pr} className="capitalize">
                        {pr.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Stitching Status
                  </label>
                  <select
                    value={selectedJobStatus}
                    onChange={(e) => setSelectedJobStatus(e.target.value as StitchingJobStatus)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    {JOB_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Special Stitching Notes
                </label>
                <textarea
                  rows={3}
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder="e.g. Extra 2 inches margin inside lehenga, scalloped lace on sleeves, organza facing on daman..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFD3]">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-[#F3EDE2] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2"
                >
                  {savingJob && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT WORKER */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsWorkerModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              {editingWorker ? 'Edit Worker Profile' : 'Add New Tailor / Worker'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Register master cutting, ladies stitching or embroidery specialists.
            </p>

            <form onSubmit={handleSaveWorker} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Master Muhammad Tariq"
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={workerStatus}
                    onChange={(e) => setWorkerStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Specialization
                </label>
                <select
                  value={workerSpec}
                  onChange={(e) => setWorkerSpec(e.target.value as WorkerSpecialization)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                >
                  {SPECIALIZATIONS.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={workerJoiningDate}
                  onChange={(e) => setWorkerJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Experience</label>
                <textarea
                  rows={2}
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder="Senior cutting master, bridal necklines, 12 years experience..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFD3]">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-[#F3EDE2] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2"
                >
                  {savingWorker && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Worker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK MEASUREMENT VIEWER */}
      {viewingMeasurementsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setViewingMeasurementsOrder(null)}
              className="absolute top-4 end-4 p-1.5 text-[#8C7E6D] hover:text-blue-950 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              Customer Measurement Sheet
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Order: <span className="font-mono font-bold text-blue-600">{viewingMeasurementsOrder.order_number}</span> · Customer: {viewingMeasurementsOrder.customer_name}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-blue-50/30 p-4 rounded-xl border border-[#E8DFD3]">
                {viewingMeasurementsOrder.measurements &&
                  Object.entries(viewingMeasurementsOrder.measurements).map(([key, val]) => {
                    if (key === 'unit' || key === 'additional_measurements' || !val) return null;
                    return (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-[#EDE2D4]">
                        <p className="text-[10px] text-slate-600 uppercase font-semibold">
                          {key.replace('_', ' ')}
                        </p>
                        <p className="text-sm font-bold text-blue-950 mt-0.5">
                          {String(val)}{' '}
                          <span className="text-[10px] font-normal text-blue-600">
                            {viewingMeasurementsOrder.measurements?.unit || 'in'}
                          </span>
                        </p>
                      </div>
                    );
                  })}
              </div>

              {viewingMeasurementsOrder.special_instructions && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">
                    Customer Special Instructions:
                  </p>
                  <p>{viewingMeasurementsOrder.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation for Worker */}
      {workerDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h4 className="font-serif-display font-bold text-base text-blue-950">
              Delete Worker Record?
            </h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this worker from the system?
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setWorkerDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-[#F3EDE2] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWorker(workerDeleteConfirmId)}
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
