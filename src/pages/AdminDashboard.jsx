import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../App';
import { LogOut, Users, CheckCircle2, XCircle, Clock, Search, Shield, AlertTriangle, Check, Filter } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const { logout, user } = useAuth();

  const stats = useQuery(api.shifts.getAdminStats) || {
    totalGuards: 0,
    presentToday: 0,
    activeToday: 0,
    completedToday: 0,
    absentOrMissedToday: 0
  };

  const shifts = useQuery(api.shifts.getAllShiftsWithUsers) || [];
  const incidents = useQuery(api.incidents.getIncidents) || [];
  const updateIncident = useMutation(api.incidents.updateIncidentStatus);

  const [activeTab, setActiveTab] = useState('shifts');
  const [activeMetric, setActiveMetric] = useState(null); // For insights/graph

  // Filters
  const [shiftSearch, setShiftSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('All');

  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('All');

  const formatDuration = (start, end) => {
    if (!start || !end) return '-';
    const mins = differenceInMinutes(end, start);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleResolveIncident = async (id, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    await updateIncident({ incidentId: id, status: newStatus });
  };

  // Filtered Shifts Data
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchSearch = s.guardName.toLowerCase().includes(shiftSearch.toLowerCase());
      const matchFilter = shiftFilter === 'All' ||
        (shiftFilter === 'Active' && s.displayStatus === 'active') ||
        (shiftFilter === 'Completed' && s.displayStatus === 'completed') ||
        (shiftFilter === 'Absent' && s.displayStatus === 'Absent (Missed Out)');
      return matchSearch && matchFilter;
    });
  }, [shifts, shiftSearch, shiftFilter]);

  // Filtered Incidents Data
  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const matchSearch = i.guardName.toLowerCase().includes(incidentSearch.toLowerCase()) ||
        i.description.toLowerCase().includes(incidentSearch.toLowerCase());

      const currentStatus = i.status === 'resolved' ? 'resolved' : 'pending';
      const matchFilter = incidentFilter === 'All' || currentStatus === incidentFilter.toLowerCase();

      return matchSearch && matchFilter;
    });
  }, [incidents, incidentSearch, incidentFilter]);


  // Graph Data Setup
  const graphData = useMemo(() => {
    if (activeMetric === 'totalGuards') {
      return [
        { name: 'Active', value: stats.activeToday, color: '#4f46e5' },
        { name: 'Completed', value: stats.completedToday, color: '#10b981' },
        { name: 'Absent/Missed', value: stats.absentOrMissedToday, color: '#ef4444' },
      ];
    }
    if (activeMetric === 'absentOrMissedToday') {
      return [
        { name: 'Present', value: stats.presentToday, color: '#10b981' },
        { name: 'Absent', value: stats.absentOrMissedToday, color: '#ef4444' }
      ];
    }
    if (activeMetric === 'status') {
      return [
        { name: 'Active Now', value: stats.activeToday, color: '#3b82f6' },
        { name: 'Completed', value: stats.completedToday, color: '#10b981' }
      ];
    }
    return [];
  }, [stats, activeMetric]);


  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 text-indigo-600">
              <Shield size={24} />
              <span className="font-bold text-xl text-slate-800">Admin Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">Logged in as {user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Guards"
            value={stats.totalGuards}
            icon={<Users className="text-blue-600" size={24} />}
            bg="bg-blue-50"
            onClick={() => setActiveMetric('totalGuards')}
            isActive={activeMetric === 'totalGuards'}
          />
          <StatCard
            title="Active Now"
            value={stats.activeToday}
            icon={<Clock className="text-indigo-600" size={24} />}
            bg="bg-indigo-50"
            onClick={() => setActiveMetric('status')}
            isActive={activeMetric === 'status'}
          />
          <StatCard
            title="Completed Shifts"
            value={stats.completedToday}
            icon={<CheckCircle2 className="text-emerald-600" size={24} />}
            bg="bg-emerald-50"
            onClick={() => setActiveMetric('status')}
          />
          <StatCard
            title="Absent/Missed"
            value={stats.absentOrMissedToday}
            icon={<XCircle className="text-red-600" size={24} />}
            bg="bg-red-50"
            alert={true}
            onClick={() => setActiveMetric('absentOrMissedToday')}
            isActive={activeMetric === 'absentOrMissedToday'}
          />
        </div>

        {/* INSIGHTS / GRAPH SECTION */}
        {activeMetric && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4 flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-700 mb-4">
              {activeMetric === 'totalGuards' ? 'Overall Workforce Distribution (Today)' :
                activeMetric === 'absentOrMissedToday' ? 'Attendance Rate vs Absence' :
                  'Shift Flow (Currently Active vs Completed)'}
            </h3>
            <div className="w-full max-w-2xl h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {graphData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => setActiveMetric(null)}
              className="mt-4 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium border border-slate-200 px-4 py-2 rounded-lg"
            >
              Close Insights
            </button>
          </div>
        )}

        {/* TABS FOR SHIFTS OR INCIDENTS */}
        <div className="flex gap-4 mb-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`pb-2 px-4 font-semibold text-lg transition-colors ${activeTab === 'shifts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Attendance & Shifts
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`pb-2 px-4 font-semibold text-lg transition-colors flex items-center gap-2 ${activeTab === 'incidents' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Incidents
            {incidents.filter(i => i.status === 'pending').length > 0 &&
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {incidents.filter(i => i.status === 'pending').length} New
              </span>
            }
          </button>
        </div>

        {/* CONTENT FOR TABS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {activeTab === 'shifts' && (
            <>
              <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> Shift Logs</h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search guards..."
                      className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                      value={shiftSearch}
                      onChange={(e) => setShiftSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  </div>
                  <div className="relative">
                    <select
                      className="pl-9 pr-8 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none w-full sm:w-auto"
                      value={shiftFilter}
                      onChange={(e) => setShiftFilter(e.target.value)}
                    >
                      <option value="All">All Shifts</option>
                      <option value="Active">Active Only</option>
                      <option value="Completed">Completed</option>
                      <option value="Absent">Absent</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Guard Name</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Check-In</th>
                      <th className="px-6 py-4">Check-Out</th>
                      <th className="px-6 py-4 text-right">Total Work</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShifts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          {shifts.length === 0 ? 'No shifts logged yet.' : 'No shifts match your filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredShifts.map((shift) => (
                        <tr key={shift._id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-6 py-4 font-medium text-slate-800 group-hover:text-indigo-700">
                            {shift.guardName}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {format(new Date(shift.date + 'T00:00:00'), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={shift.displayStatus} />
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {shift.checkInTime ? format(shift.checkInTime, 'h:mm a') : '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {shift.checkOutTime ? format(shift.checkOutTime, 'h:mm a') : '-'}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700 text-right">
                            {formatDuration(shift.checkInTime, shift.checkOutTime)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'incidents' && (
            <>
              <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" /> Incident Reports</h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-48"
                      value={incidentSearch}
                      onChange={(e) => setIncidentSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  </div>
                  <div className="relative">
                    <select
                      className="pl-9 pr-8 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none w-full sm:w-auto"
                      value={incidentFilter}
                      onChange={(e) => setIncidentFilter(e.target.value)}
                    >
                      <option value="All">All Reports</option>
                      <option value="Pending">Pending Only</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  </div>
                </div>
              </div>
              <div className="p-6">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    {incidents.length === 0 ? 'No incidents reported.' : 'No incidents match your filter.'}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredIncidents.map(inc => (
                      <div key={inc._id} className={`border rounded-xl p-5 flex flex-col sm:flex-row gap-5 justify-between items-start transition-all ${inc.status !== 'resolved' ? 'border-red-100 bg-red-50/30 hover:bg-red-50/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}>
                        <div className="flex gap-4 w-full">
                          <div className={`p-3 rounded-full h-fit flex-shrink-0 ${inc.status !== 'resolved' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                            {inc.status !== 'resolved' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                          </div>
                          <div className="w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-1 w-full justify-between sm:justify-start">
                              <span className="font-bold text-slate-800">{inc.guardName}</span>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                                {inc.category}
                              </span>
                              <span className="text-sm font-medium text-slate-400 whitespace-nowrap ml-auto sm:ml-0">
                                {format(inc.timestamp, 'MMM d • h:mm a')}
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm mt-2 font-medium">{inc.description}</p>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleResolveIncident(inc._id, inc.status)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${inc.status !== 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            {inc.status !== 'resolved' ? <><Check size={16} /> Mark Resolved</> : 'Reopen Issue'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, bg, alert, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border bg-white relative overflow-hidden group hover:shadow-md transition-all cursor-pointer ${isActive ? 'ring-2 ring-indigo-500 scale-[1.02] shadow-md border-indigo-100' :
          alert ? 'border-red-200 shadow-sm' : 'border-slate-200 shadow-sm'
        }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h4 className={`text-3xl font-bold ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${isActive ? 'scale-110 shadow-sm' : ''} transition-transform`}>
          {icon}
        </div>
      </div>
      {alert && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
      )}
      <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

function StatusBadge({ status }) {
  const lower = status.toLowerCase();

  if (lower.includes('active')) return <span className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border bg-blue-50 text-blue-700 border-blue-200 w-fit inline-block">Active</span>;
  if (lower.includes('complete')) return <span className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border bg-emerald-50 text-emerald-700 border-emerald-200 w-fit inline-block">Completed</span>;

  return <span className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border bg-red-50 text-red-700 border-red-200 w-fit inline-block">{status}</span>;
}
