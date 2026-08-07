import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import LifecycleTimeline from '../../components/LifecycleTimeline';
import {
  LayoutDashboard,
  Briefcase,
  History,
  Star,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Key,
  ShieldCheck,
  Power
} from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const { token } = router.query;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    currentJobs: [],
    jobHistory: [],
    ratings: { averageRating: 5.0, totalRatings: 0, reviews: [] }
  });

  // OTP State
  const [otpModal, setOtpModal] = useState({ show: false, type: '', ticketId: '', code: '' });
  const [otpMessage, setOtpMessage] = useState('');

  // Rating Modal state (for vendor rating citizen)
  const [ratingModal, setRatingModal] = useState({ show: false, ticketId: '', stars: 5, feedback: '' });

  // Auto-login & Data Fetching
  useEffect(() => {
    async function initVendorSession() {
      let authToken = token || localStorage.getItem('vendor_token');

      if (!authToken) {
        setLoading(false);
        setError('No secure link token provided. Please access this portal directly using the link sent to your WhatsApp.');
        return;
      }

      try {
        setLoading(true);
        // Verify Token
        const verifyRes = await fetch(`/api/vendor/verify-token?token=${authToken}`);
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
          setError(verifyData.error || 'Authentication token invalid or expired.');
          setLoading(false);
          return;
        }

        setVendor(verifyData.vendor);
        localStorage.setItem('vendor_token', authToken);

        // Fetch Dashboard Data
        const dashRes = await fetch(`/api/vendor/dashboard-data/${verifyData.vendor._id}`);
        const dashJson = await dashRes.json();

        if (dashJson.success) {
          setDashboardData({
            currentJobs: dashJson.currentJobs || [],
            jobHistory: dashJson.jobHistory || [],
            ratings: dashJson.ratings || { averageRating: 5.0, totalRatings: 0, reviews: [] }
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Vendor Dashboard init error:', err);
        setError('Failed to connect to platform backend.');
        setLoading(false);
      }
    }

    if (router.isReady) {
      initVendorSession();
    }
  }, [router.isReady, token]);

  const refreshData = async () => {
    if (!vendor) return;
    try {
      const dashRes = await fetch(`/api/vendor/dashboard-data/${vendor._id}`);
      const dashJson = await dashRes.json();
      if (dashJson.success) {
        setDashboardData({
          currentJobs: dashJson.currentJobs || [],
          jobHistory: dashJson.jobHistory || [],
          ratings: dashJson.ratings || { averageRating: 5.0, totalRatings: 0, reviews: [] }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Vendor Availability
  const toggleAvailability = async () => {
    if (!vendor) return;
    try {
      const res = await fetch(`/api/vendor/profile/${vendor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !vendor.isAvailable })
      });
      const data = await res.json();
      if (data.success) {
        setVendor(data.vendor);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // OTP Functions (Module 5 integration)
  const requestStartOtp = async (ticketId) => {
    try {
      setOtpMessage('');
      const res = await fetch('/api/otp/request-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, vendorId: vendor._id })
      });
      const data = await res.json();
      if (data.success) {
        setOtpModal({ show: true, type: 'START', ticketId, code: '' });
        setOtpMessage('Start OTP sent to Citizen WhatsApp! Ask citizen for the code.');
      } else {
        alert(data.error || 'Failed to request Start OTP');
      }
    } catch (e) {
      alert('Error requesting Start OTP');
    }
  };

  const verifyStartOtp = async () => {
    try {
      const res = await fetch('/api/otp/verify-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: otpModal.ticketId,
          vendorId: vendor._id,
          otp: otpModal.code
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpModal({ show: false, type: '', ticketId: '', code: '' });
        alert('Job Started Successfully!');
        refreshData();
      } else {
        setOtpMessage(data.error || 'Invalid OTP code. Please try again.');
      }
    } catch (e) {
      setOtpMessage('Error verifying OTP');
    }
  };

  const requestEndOtp = async (ticketId) => {
    try {
      setOtpMessage('');
      const res = await fetch('/api/otp/request-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, vendorId: vendor._id })
      });
      const data = await res.json();
      if (data.success) {
        setOtpModal({ show: true, type: 'END', ticketId, code: '' });
        setOtpMessage('End OTP sent to Citizen WhatsApp! Ask citizen for the code.');
      } else {
        alert(data.error || 'Failed to request End OTP');
      }
    } catch (e) {
      alert('Error requesting End OTP');
    }
  };

  const verifyEndOtp = async () => {
    try {
      const res = await fetch('/api/otp/verify-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: otpModal.ticketId,
          vendorId: vendor._id,
          otp: otpModal.code
        })
      });
      const data = await res.json();
      if (data.success) {
        setOtpModal({ show: false, type: '', ticketId: '', code: '' });
        // Prompt for citizen rating
        setRatingModal({ show: true, ticketId: otpModal.ticketId, stars: 5, feedback: '' });
        refreshData();
      } else {
        setOtpMessage(data.error || 'Invalid OTP code. Please try again.');
      }
    } catch (e) {
      setOtpMessage('Error verifying OTP');
    }
  };

  // Vendor Rate Citizen
  const submitVendorRating = async () => {
    try {
      const res = await fetch('/api/ratings/vendor-to-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ratingModal.ticketId,
          vendorId: vendor._id,
          stars: ratingModal.stars,
          feedback: ratingModal.feedback
        })
      });
      const data = await res.json();
      if (data.success) {
        setRatingModal({ show: false, ticketId: '', stars: 5, feedback: '' });
        alert('Thank you! Rating submitted.');
        refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Validating secure WhatsApp portal link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto my-12 glass-card p-8 rounded-2xl text-center space-y-4 border-red-500/30">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 text-sm">{error}</p>
        <p className="text-xs text-slate-500">Auto-login links are generated securely and sent via WhatsApp when jobs are broadcasted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Vendor Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{vendor.phone}</span>
              <span>•</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold">{vendor.rating.toFixed(1)}</span>
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-medium text-slate-400">Status:</span>
          <button
            onClick={toggleAvailability}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              vendor.isAvailable
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{vendor.isAvailable ? 'Available for Jobs' : 'Offline / Busy'}</span>
          </button>
        </div>
      </div>

      {/* Portal Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Current Jobs ({dashboardData.currentJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Job History ({dashboardData.jobHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ratings')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'ratings'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Ratings</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{dashboardData.currentJobs.length}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Jobs Completed</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{dashboardData.jobHistory.length}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Rating Score</span>
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{vendor.rating.toFixed(1)} / 5.0</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Service Areas</span>
                <MapPin className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{vendor.pincodes.length} Pincodes</p>
            </div>
          </div>

          {/* Quick Active Jobs Overview */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Active Job In Progress</span>
            </h3>

            {dashboardData.currentJobs.length === 0 ? (
              <p className="text-slate-400 text-sm">No active jobs right now. WhatsApp alerts will notify you when new requests arrive.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.currentJobs.map((job) => (
                  <div key={job.ticketId} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md font-bold w-fit">
                        {job.ticketId}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit">
                        Status: {job.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{job.serviceCategory}</h4>
                      <p className="text-xs text-slate-300 mt-1">{job.issueDetails}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.address} ({job.pincode})</span>
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                      {job.status === 'Assigned' && (
                        <button
                          onClick={() => requestStartOtp(job.ticketId)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Request Start OTP</span>
                        </button>
                      )}
                      {job.status === 'Started' && (
                        <button
                          onClick={() => requestEndOtp(job.ticketId)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Request End OTP</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CURRENT JOBS */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Current Active Jobs</h2>

          {dashboardData.currentJobs.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No active jobs assigned at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dashboardData.currentJobs.map((job) => (
                <div key={job.ticketId} className="glass-card p-6 rounded-2xl space-y-4 border-slate-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md border border-blue-500/20">
                        {job.ticketId}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{job.serviceCategory}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {job.status}
                    </span>
                  </div>

                  <div className="text-sm space-y-2 text-slate-300">
                    <p><strong>Issue:</strong> {job.issueDetails}</p>
                    <p className="flex items-start space-x-1.5">
                      <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{job.address} - <strong>{job.pincode}</strong></span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Citizen Contact: {job.citizenPhone}</span>
                    </p>
                    {job.photoUrl && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-400 mb-1">Attached Photo:</p>
                        <a href={job.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">View Media Attachment</a>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                    {job.status === 'Assigned' && (
                      <button
                        onClick={() => requestStartOtp(job.ticketId)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Start Job (Enter Citizen OTP)</span>
                      </button>
                    )}
                    {job.status === 'Started' && (
                      <button
                        onClick={() => requestEndOtp(job.ticketId)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Complete Job (Enter Citizen End OTP)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: JOB HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Job History</h2>

          {dashboardData.jobHistory.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No completed jobs in history yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {dashboardData.jobHistory.map((job) => (
                <div key={job.ticketId} className="glass-card p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-300">{job.ticketId}</span>
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{job.serviceCategory}</h4>
                    <p className="text-xs text-slate-400 mt-1">{job.issueDetails}</p>
                    <p className="text-xs text-slate-500 mt-1">{job.address} ({job.pincode})</p>
                  </div>

                  {job.citizenRating?.stars > 0 && (
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Citizen Rating:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-amber-400">{job.citizenRating.stars} / 5</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RATINGS */}
      {activeTab === 'ratings' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl flex items-center space-x-6">
            <div className="text-center space-y-1">
              <span className="text-4xl font-extrabold text-amber-400">{vendor.rating.toFixed(1)}</span>
              <div className="flex justify-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(vendor.rating) ? 'fill-amber-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <p className="text-xs text-slate-400">{vendor.totalRatings} Total Reviews</p>
            </div>
            <div className="border-l border-slate-800 pl-6 space-y-1">
              <h3 className="text-lg font-bold text-white">Vendor Reputation</h3>
              <p className="text-xs text-slate-400">
                Ratings are updated dynamically from citizen feedback upon job completion via WhatsApp and portal verification.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Recent Customer Reviews</h3>
            {dashboardData.ratings.reviews?.length === 0 ? (
              <p className="text-slate-400 text-sm glass-card p-6 rounded-xl">No individual reviews received yet.</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.ratings.reviews?.map((rev, i) => (
                  <div key={i} className="glass-card p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="font-mono text-slate-300">{rev.ticketId}</span>
                      <div className="flex items-center space-x-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold">{rev.citizenRating?.stars} / 5</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{rev.serviceCategory}</p>
                    {rev.citizenRating?.feedback && (
                      <p className="text-xs text-slate-400 italic">"{rev.citizenRating.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white">Vendor Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Vendor Name</span>
              <p className="text-base font-bold text-white">{vendor.name}</p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">WhatsApp Phone</span>
              <p className="text-base font-bold text-white">{vendor.phone}</p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Categories Serviced</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {vendor.categories.map((cat, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Assigned Pincodes</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {vendor.pincodes.map((pin, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {pin}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP MODAL (MODULE 5 INTEGRATION) */}
      {otpModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span>Verify {otpModal.type} OTP</span>
            </h3>

            <p className="text-xs text-slate-300">{otpMessage}</p>

            <input
              type="text"
              placeholder="Enter 4-digit OTP from Citizen"
              maxLength={6}
              value={otpModal.code}
              onChange={(e) => setOtpModal({ ...otpModal, code: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-blue-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setOtpModal({ show: false, type: '', ticketId: '', code: '' })}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={otpModal.type === 'START' ? verifyStartOtp : verifyEndOtp}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Verify & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL FOR VENDOR TO RATE CITIZEN (MODULE 6 INTEGRATION) */}
      {ratingModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl space-y-4 border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Rate Citizen Experience</span>
            </h3>

            <div className="flex justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRatingModal({ ...ratingModal, stars: s })}
                  className="p-1"
                >
                  <Star className={`w-8 h-8 ${s <= ratingModal.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Add optional feedback comment..."
              rows={3}
              value={ratingModal.feedback}
              onChange={(e) => setRatingModal({ ...ratingModal, feedback: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRatingModal({ show: false, ticketId: '', stars: 5, feedback: '' })}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
              >
                Skip
              </button>
              <button
                onClick={submitVendorRating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
