'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Users,
  Lock,
  Activity,
  RefreshCw,
  X,
  Search,
  Filter,
  UserCheck,
  UserX,
  Ban,
  Unlock,
  Key,
  Mail,
} from 'lucide-react';

interface SecurityDashboardData {
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    activeSessions: number;
    activeSessionUsers: number;
    lockedAccounts: number;
    failedLoginsLastHour: number;
    loginSuccessRate: number;
    totalLoginsLast7Days: number;
  };
  alerts: any[];
  topFailingIps: any[];
  suspiciousUsers: any[];
  recentEvents: any[];
}

export default function SecurityDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Users tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [actionModal, setActionModal] = useState<{ open: boolean; user: any; action: string }>({ open: false, user: null, action: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPhantomUsers, setShowPhantomUsers] = useState(false); // Toggle for showing unverified/trial users

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if ((session?.user as any)?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/security/dashboard?hours=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch security data');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((session?.user as any)?.role === 'admin') {
      fetchData();
    }
  }, [session, timeRange]);

  // Fetch users data
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      // Only show "real" users (active, suspended, disabled) by default
      // Include phantom users (pending_verification, trial, expired) only if toggle is on
      if (!showPhantomUsers) {
        params.set('excludeStatus', 'pending_verification,trial,expired');
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && (session?.user as any)?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, currentPage, searchQuery, statusFilter, session, showPhantomUsers]);

  // Handle user action
  const handleUserAction = async () => {
    if (!actionModal.user || !actionModal.action) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: actionModal.user.id,
          action: actionModal.action,
          reason: actionReason,
          lockDuration: actionModal.action === 'lock' ? 24 * 60 * 60 * 1000 : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setSuccessMessage(result.message);

      if (actionModal.action === 'reset_password' && result.tempPassword) {
        setTempPassword(result.tempPassword);
      }

      await fetchUsers();

      if (actionModal.action !== 'reset_password') {
        setTimeout(() => {
          setActionModal({ open: false, user: null, action: '' });
          setActionReason('');
          setTempPassword(null);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Security Dashboard
          </h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Security Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Monitor authentication, sessions, and security events</p>
        </div>
        <div className="flex items-center gap-4">
          <select value={timeRange} onChange={(e) => setTimeRange(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
          <button onClick={fetchData} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Overview & Alerts
          </button>
          <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </span>
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{data.summary.criticalAlerts}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">{data.summary.warningAlerts} warnings</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{data.summary.activeSessions}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {data.summary.activeSessionUsers} unique user{data.summary.activeSessionUsers !== 1 ? 's' : ''} logged in
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Login Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{data.summary.loginSuccessRate}%</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">{data.summary.totalLoginsLast7Days} attempts (7 days)</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Failed Logins</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{data.summary.failedLoginsLastHour}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">{data.summary.lockedAccounts} accounts locked</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Recent Security Alerts
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                    <p>No security alerts in the selected timeframe</p>
                  </div>
                ) : (
                  data.alerts.map((alert, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedAlert(alert)}>
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-2 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{alert.eventType.replace(/_/g, ' ')}</p>
                            <span className="text-sm text-gray-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{alert.email || alert.ipAddress || 'System'}</p>
                          {alert.details && <p className="text-sm text-gray-400 mt-1">{JSON.stringify(alert.details).slice(0, 100)}...</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" />
                  Suspicious IPs
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.topFailingIps.length === 0 ? (
                  <div className="p-8 text-center text-gray-500"><p>No suspicious activity detected</p></div>
                ) : (
                  data.topFailingIps.map((ip, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900">{ip._id || 'Unknown'}</p>
                          <p className="text-sm text-gray-500 mt-1">{ip.count} failed attempts</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{ip.count}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {data.suspiciousUsers.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Suspicious User Activity
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data.suspiciousUsers.map((user, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.user?.email || user.user?.username || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500 mt-1">{user.eventCount} suspicious events</p>
                      <p className="text-sm text-gray-400">Events: {user.events?.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Last: {new Date(user.lastEvent).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-emerald-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search by email or username..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-500" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                  <option value="disabled">Disabled/Terminated</option>
                </select>
                <button onClick={fetchUsers} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">Total: {pagination.total} users | Page {pagination.page} of {pagination.totalPages || 1}</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPhantomUsers}
                  onChange={(e) => { setShowPhantomUsers(e.target.checked); setCurrentPage(1); }}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-600">Show unverified/trial users ({showPhantomUsers ? 'included' : 'excluded'})</span>
              </label>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {usersLoading ? (
              <div className="p-12 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed Attempts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id || user._id || `user-${user.email}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{user.email || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{user.username || ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.accountStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : user.accountStatus === 'suspended' ? 'bg-amber-100 text-amber-800' : user.accountStatus === 'disabled' ? 'bg-red-100 text-red-800' : user.accountStatus === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {user.accountStatus?.replace('_', ' ') || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.isVerified ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <X className="h-5 w-5 text-red-600" />}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className={user.failedLoginAttempts > 0 ? 'text-red-600 font-medium' : ''}>{user.failedLoginAttempts || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {user.accountStatus === 'active' && (<>
                                <button onClick={() => setActionModal({ open: true, user, action: 'suspend' })} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Suspend"><UserX className="h-4 w-4" /></button>
                                <button onClick={() => setActionModal({ open: true, user, action: 'terminate' })} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Terminate"><Ban className="h-4 w-4" /></button>
                              </>)}
                              {(user.accountStatus === 'suspended' || user.accountStatus === 'disabled') && (
                                <button onClick={() => setActionModal({ open: true, user, action: 'activate' })} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Activate"><UserCheck className="h-4 w-4" /></button>
                              )}
                              {user.lockedUntil && (
                                <button onClick={() => setActionModal({ open: true, user, action: 'unlock' })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Unlock"><Unlock className="h-4 w-4" /></button>
                              )}
                              <button onClick={() => setActionModal({ open: true, user, action: 'lock' })} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Lock"><Lock className="h-4 w-4" /></button>
                              <button onClick={() => setActionModal({ open: true, user, action: 'reset_password' })} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Reset Password"><Key className="h-4 w-4" /></button>
                              {!user.isVerified && (
                                <button onClick={() => setActionModal({ open: true, user, action: 'verify_email' })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Verify Email"><Mail className="h-4 w-4" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>{pageNum}</button>;
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { if (!actionLoading) { setActionModal({ open: false, user: null, action: '' }); setActionReason(''); setTempPassword(null); setSuccessMessage(''); } }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {actionModal.action === 'activate' && 'Activate Account'}
                {actionModal.action === 'suspend' && 'Suspend Account'}
                {actionModal.action === 'terminate' && 'Terminate Account'}
                {actionModal.action === 'lock' && 'Lock Account'}
                {actionModal.action === 'unlock' && 'Unlock Account'}
                {actionModal.action === 'reset_password' && 'Reset Password'}
                {actionModal.action === 'verify_email' && 'Verify Email'}
              </h3>
              {!actionLoading && (<button onClick={() => { setActionModal({ open: false, user: null, action: '' }); setActionReason(''); setTempPassword(null); setSuccessMessage(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5" /></button>)}
            </div>

            {successMessage ? (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <p className="text-emerald-800 font-medium">{successMessage}</p>
                </div>
                {tempPassword && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 mb-2">Temporary Password:</p>
                    <code className="flex-1 p-2 bg-white rounded border border-amber-300 text-lg font-mono text-center block">{tempPassword}</code>
                    <p className="text-xs text-amber-700 mt-2">⚠️ Share this with the user securely. They will be required to change it on first login.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900"><strong>User:</strong> {actionModal.user?.email}</p>
                  <p className="text-sm text-blue-900 mt-1"><strong>Current Status:</strong> {actionModal.user?.accountStatus?.replace('_', ' ')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                  <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Provide a reason for this action..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                {actionModal.action === 'terminate' && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-800">⚠️ <strong>Warning:</strong> This will permanently disable the account and revoke all active sessions.</p></div>)}
                {actionModal.action === 'reset_password' && (<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-sm text-amber-800">🔑 A new temporary password will be generated. The user will be required to change it on next login.</p></div>)}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setActionModal({ open: false, user: null, action: '' }); setActionReason(''); }} disabled={actionLoading} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                  <button onClick={handleUserAction} disabled={actionLoading} className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${actionModal.action === 'terminate' ? 'bg-red-600 hover:bg-red-700' : actionModal.action === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : actionModal.action === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {actionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Alert Details</h3>
              <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm font-medium text-gray-500">Event Type</label><p className="text-lg font-medium">{selectedAlert.eventType.replace(/_/g, ' ')}</p></div>
              <div><label className="text-sm font-medium text-gray-500">Severity</label><span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-800' : selectedAlert.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{selectedAlert.severity}</span></div>
              <div><label className="text-sm font-medium text-gray-500">Time</label><p>{new Date(selectedAlert.createdAt).toLocaleString()}</p></div>
              {selectedAlert.email && (<div><label className="text-sm font-medium text-gray-500">User Email</label><p>{selectedAlert.email}</p></div>)}
              {selectedAlert.ipAddress && (<div><label className="text-sm font-medium text-gray-500">IP Address</label><p className="font-mono">{selectedAlert.ipAddress}</p></div>)}
              {selectedAlert.details && (<div><label className="text-sm font-medium text-gray-500">Details</label><pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-sm">{JSON.stringify(selectedAlert.details, null, 2)}</pre></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
