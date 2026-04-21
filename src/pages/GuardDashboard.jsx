import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../App';
import { LogOut, CheckCircle, LogOut as SignOut, AlertTriangle, User, History, Send } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

export default function GuardDashboard() {
  const { logout, user } = useAuth();

  // Shifts
  const todayShift = useQuery(api.shifts.getGuardTodayShift, { guardId: user._id });
  const recentShifts = useQuery(api.shifts.getGuardRecentShifts, { guardId: user._id }) || [];

  const checkIn = useMutation(api.shifts.checkIn);
  const checkOut = useMutation(api.shifts.checkOut);

  // Incidents
  const reportIncident = useMutation(api.incidents.reportIncident);
  const guardIncidents = useQuery(api.incidents.getIncidentsByGuard, { guardId: user._id }) || [];

  const [incCategory, setIncCategory] = useState('other');
  const [incDesc, setIncDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  const getLocation = () => new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => {
          alert("Location access is required for security tracking. Please allow location access in your browser and try again.");
          resolve(null);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      resolve(null);
    }
  });

  const handleCheckIn = async () => {
    try {
      setIsSubmitting(true);
      const loc = await getLocation();
      if (!loc) {
        setIsSubmitting(false);
        return;
      }
      await checkIn({ guardId: user._id, location: loc });
    } catch (err) {
      alert(err.message || "Failed to check in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsSubmitting(true);
      const loc = await getLocation();
      if (!loc) {
        setIsSubmitting(false);
        return;
      }
      await checkOut({ guardId: user._id, location: loc });
    } catch (err) {
      alert(err.message || "Failed to check out");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incDesc.trim()) return alert("Description is required");

    try {
      setIsSubmitting(true);
      const loc = await getLocation();
      if (!loc) {
        setIsSubmitting(false);
        return;
      }
      await reportIncident({
        guardId: user._id,
        category: incCategory,
        description: incDesc.trim(),
        location: loc
      });
      alert("Incident reported successfully.");
      setIncDesc('');
      setShowIncidentForm(false);
    } catch (err) {
      alert("Failed to report incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeFormat = (date, fmt) => {
    if (!date) return '-';
    try {
      return format(date, fmt);
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '-';
    try {
      const mins = differenceInMinutes(end, start);
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    } catch (e) {
      return '-';
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <User size={24} className="text-indigo-200" />
              <span className="font-bold text-lg">Guard Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 hover:text-indigo-200 transition-colors bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 left-0 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Today's Shift</h2>

          <div className="my-6">
            {todayShift === undefined ? (
              <p className="text-slate-400">Loading...</p>
            ) : !todayShift ? (
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg border bg-slate-100 text-slate-600 border-slate-200">
                  Not Checked In
                </div>
                <p className="text-slate-500 mt-2">You haven't started your shift today.</p>
              </div>
            ) : todayShift.status === 'active' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xl border bg-blue-50 text-blue-700 border-blue-200 shadow-sm animate-pulse">
                  <CheckCircle size={24} /> Active Shift
                </div>
                <p className="text-slate-600 mt-2 font-medium">
                  Started at {safeFormat(todayShift.checkInTime, 'h:mm a')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xl border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
                  <CheckCircle size={24} /> Shift Completed
                </div>
                <p className="text-slate-600 mt-2">
                  Total work: {formatDuration(todayShift.checkInTime, todayShift.checkOutTime)}
                </p>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {(!todayShift) && (
                <button
                  onClick={handleCheckIn}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-lg rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-md"
                >
                  <CheckCircle size={24} />
                  Start Shift (Check In)
                </button>
              )}

              {(todayShift && todayShift.status === 'active') && (
                <button
                  onClick={handleCheckOut}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-md"
                >
                  <SignOut size={24} />
                  End Shift (Check Out)
                </button>
              )}
            </div>

            <button
              onClick={() => setShowIncidentForm(!showIncidentForm)}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium py-3 rounded-xl border-2 border-slate-200 hover:border-red-200 transition-all font-semibold"
            >
              <AlertTriangle size={20} className={showIncidentForm ? 'text-red-600' : ''} />
              Report an Incident
            </button>
          </div>
        </div>

        {/* Incident Form (Collapsible) */}
        {showIncidentForm && (
          <div className="bg-red-50/50 rounded-2xl shadow-sm border border-red-200 p-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} /> Incident Form
            </h3>
            <form onSubmit={handleReportIncident} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option value="theft">Theft / Break-in</option>
                  <option value="violence">Violence / Conflict</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="hazard">Safety Hazard</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What happened?</label>
                <textarea
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  required
                  placeholder="Describe the incident details..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm bg-white min-h-[100px]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  <Send size={16} /> Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <History className="text-slate-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-800">Past Shifts</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {recentShifts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                You haven't logged any shifts yet.
              </div>
            ) : (
              recentShifts.map((shift) => (
                <div key={shift._id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {safeFormat(shift.date ? new Date(shift.date + 'T00:00:00') : null, 'MMM do, yyyy')}
                    </h4>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                      <span>In: {shift.checkInTime ? safeFormat(shift.checkInTime, 'h:mm a') : '-'}</span>
                      <span>Out: {shift.checkOutTime ? safeFormat(shift.checkOutTime, 'h:mm a') : '-'}</span>
                    </div>
                  </div>
                  <div>
                    {shift.status === 'completed' ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        {formatDuration(shift.checkInTime, shift.checkOutTime)}
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-red-50/50 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-800">Your Incident Reports</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {!guardIncidents || guardIncidents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No incidents reported.
              </div>
            ) : (
              guardIncidents.map((inc) => (
                <div key={inc._id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase text-xs tracking-wider bg-slate-100 px-2 py-1 rounded-md">{inc.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {inc.status === 'resolved' ? 'Resolved' : 'Pending Review'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm mt-1">{inc.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{safeFormat(inc.timestamp, 'MMM do, yyyy h:mm a')}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
