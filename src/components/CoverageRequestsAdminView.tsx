import React, { useState, useEffect } from 'react';
import { CoverageRequest, CoverageRequestStatus, CoverageType, UserProfile } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { supabase } from '../utils/supabaseClient';
import { 
  Search, RefreshCw, Calendar, MapPin, Mail, Phone, 
  Clock, CheckCircle2, AlertCircle, Eye, X, Filter,
  Building2, User, Camera, Video, Film, Check, Loader2
} from 'lucide-react';

interface CoverageRequestsAdminViewProps {
  lang: LanguageType;
  currentUser: UserProfile;
}

export default function CoverageRequestsAdminView({
  lang,
  currentUser
}: CoverageRequestsAdminViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [requests, setRequests] = useState<CoverageRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CoverageRequestStatus>('all');

  // Modal / Detail state
  const [selectedRequest, setSelectedRequest] = useState<CoverageRequest | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCoverageRequests = async () => {
    try {
      setErrorMessage(null);
      const { data, error } = await supabase
        .from('coverage_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coverage requests:', error);
        setErrorMessage(t.updateStatusError || 'Unable to load coverage requests.');
      } else if (data) {
        const mappedRequests: CoverageRequest[] = data.map((item: any) => ({
          id: item.id,
          organizationName: item.organization_name,
          contactPerson: item.contact_person,
          email: item.email,
          phone: item.phone || undefined,
          eventName: item.event_name,
          eventDate: item.event_date || undefined,
          location: item.location || undefined,
          coverageType: item.coverage_type as CoverageType,
          message: item.message || undefined,
          status: item.status as CoverageRequestStatus,
          createdAt: item.created_at,
          updatedAt: item.updated_at || undefined
        }));
        setRequests(mappedRequests);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching coverage requests:', err);
      setErrorMessage(t.updateStatusError || 'Unable to load coverage requests.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoverageRequests();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCoverageRequests();
  };

  const handleUpdateStatus = async (id: string, newStatus: CoverageRequestStatus) => {
    setUpdatingId(id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('coverage_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        setErrorMessage(t.updateStatusError || 'Failed to update request status.');
      } else {
        setRequests(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r))
        );
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
        }
        setSuccessMessage(t.updateStatusSuccess || 'Status updated successfully.');
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Unexpected error updating status:', err);
      setErrorMessage(t.updateStatusError || 'Failed to update request status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter & search logic
  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;

    const matchesSearch =
      r.organizationName.toLowerCase().includes(query) ||
      r.contactPerson.toLowerCase().includes(query) ||
      r.eventName.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      (r.location && r.location.toLowerCase().includes(query)) ||
      (r.phone && r.phone.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CoverageRequestStatus) => {
    switch (status) {
      case 'new':
        return {
          label: t.statusNew || 'New',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'contacted':
        return {
          label: t.statusContacted || 'Contacted',
          className: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'accepted':
        return {
          label: t.statusAccepted || 'Accepted',
          className: 'bg-emerald-100 text-emerald-900 border-emerald-300'
        };
      case 'declined':
        return {
          label: t.statusDeclined || 'Declined',
          className: 'bg-red-100 text-red-900 border-red-300'
        };
      case 'completed':
        return {
          label: t.statusCompleted || 'Completed',
          className: 'bg-stone-200 text-stone-800 border-stone-300'
        };
      default:
        return {
          label: status,
          className: 'bg-stone-100 text-stone-700 border-stone-200'
        };
    }
  };

  const getCoverageTypeLabel = (type: CoverageType) => {
    switch (type) {
      case 'photography':
        return { label: t.coveragePhoto || 'Photography', icon: <Camera className="w-3.5 h-3.5" /> };
      case 'videography':
        return { label: t.coverageVideo || 'Videography', icon: <Video className="w-3.5 h-3.5" /> };
      case 'both':
        return { label: t.coverageBoth || 'Photography & Videography', icon: <Film className="w-3.5 h-3.5" /> };
      default:
        return { label: type, icon: <Camera className="w-3.5 h-3.5" /> };
    }
  };

  const statusCounts = {
    all: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    declined: requests.filter(r => r.status === 'declined').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 p-5 rounded-xl border border-[#5C130F]/15 shadow-2xs">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#5C130F]">
            {t.coverageRequestsTitle || 'Event Coverage Requests'}
          </h2>
          <p className="font-sans text-xs text-[#3A1A14]/75 mt-0.5">
            {t.coverageRequestsSubtitle || 'Review, respond to and manage coverage requests from community organizations'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF4E8] text-[#5C130F] border border-[#5C130F]/20 rounded-lg text-xs font-semibold font-sans transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#BA8332]' : ''}`} />
          <span>{isRefreshing ? t.loading : (lang === 'en' ? 'Refresh' : 'تحديث')}</span>
        </button>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white/60 border border-[#5C130F]/15 rounded-xl">
          {(['all', 'new', 'contacted', 'accepted', 'declined', 'completed'] as const).map(tab => {
            const isSelected = statusFilter === tab;
            const count = statusCounts[tab];
            let label = t.filterAll || 'All';
            if (tab === 'new') label = t.statusNew || 'New';
            if (tab === 'contacted') label = t.statusContacted || 'Contacted';
            if (tab === 'accepted') label = t.statusAccepted || 'Accepted';
            if (tab === 'declined') label = t.statusDeclined || 'Declined';
            if (tab === 'completed') label = t.statusCompleted || 'Completed';

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#5C130F] text-white shadow-2xs'
                    : 'text-[#3A1A14]/80 hover:bg-[#FAF4E8] hover:text-[#5C130F]'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#5C130F]/10 text-[#5C130F]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] md:w-80">
          <Search className="w-4 h-4 text-[#3A1A14]/40 absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchRequestsPlaceholder || 'Search requests...'}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-white border border-[#5C130F]/15 text-xs text-[#3A1A14] placeholder-[#3A1A14]/40 font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center gap-3 bg-white/40 rounded-xl border border-[#5C130F]/10">
          <Loader2 className="w-7 h-7 animate-spin text-[#BA8332]" />
          <p className="font-serif italic text-sm text-[#3A1A14]/70">{t.loading}</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white/40 rounded-xl border border-[#5C130F]/10 flex flex-col items-center gap-2">
          <p className="font-serif italic text-base text-[#3A1A14]/70">
            {t.noRequestsFound || 'No coverage requests found.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#BA8332] hover:underline font-sans font-semibold mt-1"
            >
              {lang === 'en' ? 'Clear search filter' : 'مسح البحث'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#5C130F]/15 overflow-hidden shadow-2xs">
          
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#FAF4E8] border-b border-[#5C130F]/15 text-[#5C130F] font-semibold">
                  <th className="py-3 px-4">{t.organizationCol || 'Organization'}</th>
                  <th className="py-3 px-4">{t.contactPersonCol || 'Contact Person'}</th>
                  <th className="py-3 px-4">{t.eventCol || 'Event / Miqaat'}</th>
                  <th className="py-3 px-4">{t.coverageTypeCol || 'Coverage Type'}</th>
                  <th className="py-3 px-4">{t.statusCol || 'Status'}</th>
                  <th className="py-3 px-4">{t.submittedAtCol || 'Submitted'}</th>
                  <th className="py-3 px-4 text-right">{t.actionsCol || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5C130F]/10 text-[#3A1A14]">
                {filteredRequests.map(req => {
                  const badge = getStatusBadge(req.status);
                  const coverage = getCoverageTypeLabel(req.coverageType);
                  const isUpdating = updatingId === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-[#FAF4E8]/40 transition-colors">
                      {/* Org Name */}
                      <td className="py-3.5 px-4 font-semibold text-[#5C130F]">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#BA8332] shrink-0" />
                          <span className="truncate max-w-[180px]" title={req.organizationName}>
                            {req.organizationName}
                          </span>
                        </div>
                      </td>

                      {/* Contact Person & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#3A1A14]">{req.contactPerson}</span>
                          <span className="text-[11px] text-[#3A1A14]/60 font-mono truncate max-w-[160px]">{req.email}</span>
                        </div>
                      </td>

                      {/* Event Name & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-serif font-semibold text-[#5C130F] truncate max-w-[200px]" title={req.eventName}>
                            {req.eventName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-[#3A1A14]/70 mt-0.5">
                            {req.eventDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#BA8332]" />
                                {req.eventDate}
                              </span>
                            )}
                            {req.location && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[120px]" title={req.location}>
                                <MapPin className="w-3 h-3 text-[#BA8332]" />
                                {req.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coverage Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF4E8] text-[#5C130F] border border-[#BA8332]/25 font-medium text-[11px]">
                          {coverage.icon}
                          <span>{coverage.label}</span>
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={req.status}
                            disabled={isUpdating}
                            onChange={e => handleUpdateStatus(req.id, e.target.value as CoverageRequestStatus)}
                            className={`text-[11px] font-semibold py-1 px-2.5 rounded-md border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#BA8332] ${badge.className}`}
                          >
                            <option value="new">{t.statusNew || 'New'}</option>
                            <option value="contacted">{t.statusContacted || 'Contacted'}</option>
                            <option value="accepted">{t.statusAccepted || 'Accepted'}</option>
                            <option value="declined">{t.statusDeclined || 'Declined'}</option>
                            <option value="completed">{t.statusCompleted || 'Completed'}</option>
                          </select>
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#3A1A14]/70">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#FAF4E8] hover:bg-[#5C130F] hover:text-white text-[#5C130F] border border-[#5C130F]/20 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.viewDetailsBtn || 'Details'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET CARDS VIEW */}
          <div className="lg:hidden divide-y divide-[#5C130F]/15 p-4 space-y-4">
            {filteredRequests.map(req => {
              const badge = getStatusBadge(req.status);
              const coverage = getCoverageTypeLabel(req.coverageType);
              const isUpdating = updatingId === req.id;

              return (
                <div key={req.id} className="pt-4 first:pt-0 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#5C130F]">
                        {req.eventName}
                      </h4>
                      <p className="text-xs text-[#3A1A14] font-medium mt-0.5">
                        {req.organizationName} • {req.contactPerson}
                      </p>
                    </div>

                    <select
                      value={req.status}
                      disabled={isUpdating}
                      onChange={e => handleUpdateStatus(req.id, e.target.value as CoverageRequestStatus)}
                      className={`text-[11px] font-semibold py-1 px-2 rounded-md border shrink-0 cursor-pointer ${badge.className}`}
                    >
                      <option value="new">{t.statusNew || 'New'}</option>
                      <option value="contacted">{t.statusContacted || 'Contacted'}</option>
                      <option value="accepted">{t.statusAccepted || 'Accepted'}</option>
                      <option value="declined">{t.statusDeclined || 'Declined'}</option>
                      <option value="completed">{t.statusCompleted || 'Completed'}</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[#3A1A14]/80">
                    <span className="inline-flex items-center gap-1 bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#BA8332]/20">
                      {coverage.icon}
                      <span>{coverage.label}</span>
                    </span>
                    {req.eventDate && (
                      <span className="inline-flex items-center gap-1 bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#5C130F]/15">
                        <Calendar className="w-3 h-3 text-[#BA8332]" />
                        <span>{req.eventDate}</span>
                      </span>
                    )}
                    {req.location && (
                      <span className="inline-flex items-center gap-1 bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#5C130F]/15">
                        <MapPin className="w-3 h-3 text-[#BA8332]" />
                        <span>{req.location}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#5C130F]/10">
                    <span className="text-[10px] font-mono text-[#3A1A14]/60">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#BA8332] hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.viewDetailsBtn || 'View Details'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] border border-[#5C130F]/30 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn font-sans text-[#3A1A14]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#5C130F]/15 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#BA8332]">
                  {t.requestDetailsTitle || 'Coverage Request Details'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#5C130F] mt-1">
                  {selectedRequest.eventName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-[#3A1A14]/60 hover:text-[#5C130F] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Grid Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.orgNameLabel || 'Organization'}
                </span>
                <p className="font-semibold text-sm text-[#5C130F]">{selectedRequest.organizationName}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.contactPersonLabel || 'Contact Person'}
                </span>
                <p className="font-semibold text-sm text-[#3A1A14]">{selectedRequest.contactPerson}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.contactEmailLabel || 'Email Address'}
                </span>
                <a href={`mailto:${selectedRequest.email}`} className="text-[#BA8332] hover:underline font-mono">
                  {selectedRequest.email}
                </a>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.contactPhoneLabel || 'Phone'}
                </span>
                {selectedRequest.phone ? (
                  <a href={`tel:${selectedRequest.phone}`} className="text-[#3A1A14] hover:underline font-mono">
                    {selectedRequest.phone}
                  </a>
                ) : (
                  <span className="text-stone-400 italic">None provided</span>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.eventDateLabel || 'Event Date'}
                </span>
                <p className="font-medium text-[#3A1A14]">{selectedRequest.eventDate || 'Not specified'}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.contactLocationLabel || 'Location'}
                </span>
                <p className="font-medium text-[#3A1A14]">{selectedRequest.location || 'Not specified'}</p>
              </div>
            </div>

            {/* Coverage Type & Current Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.coverageRequiredLabel || 'Coverage Required'}
                </span>
                <p className="font-semibold text-sm text-[#5C130F]">
                  {getCoverageTypeLabel(selectedRequest.coverageType).label}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#5C130F]/10">
                <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                  {t.statusCol || 'Status'}
                </span>
                <select
                  value={selectedRequest.status}
                  disabled={updatingId === selectedRequest.id}
                  onChange={e => handleUpdateStatus(selectedRequest.id, e.target.value as CoverageRequestStatus)}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-md border w-full cursor-pointer ${getStatusBadge(selectedRequest.status).className}`}
                >
                  <option value="new">{t.statusNew || 'New'}</option>
                  <option value="contacted">{t.statusContacted || 'Contacted'}</option>
                  <option value="accepted">{t.statusAccepted || 'Accepted'}</option>
                  <option value="declined">{t.statusDeclined || 'Declined'}</option>
                  <option value="completed">{t.statusCompleted || 'Completed'}</option>
                </select>
              </div>
            </div>

            {/* Message Box */}
            <div className="p-4 bg-white rounded-lg border border-[#5C130F]/10 text-xs">
              <span className="text-[10px] uppercase font-semibold text-[#5C130F]/80 block mb-1">
                {t.messageDetailsLabel || 'Message / Additional Details'}
              </span>
              <p className="text-sm text-[#3A1A14] leading-relaxed whitespace-pre-wrap font-sans">
                {selectedRequest.message || (
                  <span className="italic text-stone-400">
                    {t.noMessageProvided || 'No additional details provided.'}
                  </span>
                )}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#5C130F]/15 pt-4 text-xs text-[#3A1A14]/60">
              <span className="font-mono text-[11px]">
                {t.submittedAtCol || 'Submitted'}: {new Date(selectedRequest.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 bg-[#5C130F] hover:bg-[#480E0B] text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                {t.closeModal || 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
