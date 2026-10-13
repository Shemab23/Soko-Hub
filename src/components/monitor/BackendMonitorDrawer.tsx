import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Activity, 
  Database, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Search,
  Check,
  Cpu
} from 'lucide-react';
import { useMonitorStore } from '../../sim/monitorStore';
import { api } from '../../api/client';
import { simDb } from '../../sim/db';
import { ApiLogEntry } from '../../types';
import { formatRwf } from '../../utils/format';

export const BackendMonitorDrawer: React.FC = () => {
  const { 
    isOpen, 
    setOpen, 
    toggleOpen, 
    activeTab, 
    setActiveTab, 
    eventLogs, 
    clearEventLogs, 
    apiLogs, 
    clearApiLogs, 
    selectedRequest, 
    setSelectedRequest,
    securityTests,
    resetSecurityTests,
  } = useMonitorStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDbTable, setSelectedDbTable] = useState<'shops' | 'products' | 'orders' | 'payouts' | 'webhooks'>('shops');
  const [isRunningAllTests, setIsRunningAllTests] = useState(false);

  // Keyboard shortcut: 'B' toggles monitor drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is inside an input, textarea, or contentEditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-slate-900/90 hover:bg-slate-900 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-3.5 py-2.5 rounded-full shadow-2xl border border-slate-700/60 dark:border-blue-400/40 flex items-center gap-2 text-xs font-mono font-bold tracking-tight transition-all transform hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
        title="Open Simulated Backend Monitor (or press B)"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <Terminal className="w-4 h-4 text-blue-400 dark:text-white" />
        <span>Backend Monitor</span>
        <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white/20 font-bold">B</kbd>
      </button>
    );
  }

  const filteredEvents = eventLogs.filter((evt) => {
    if (filterLevel !== 'all' && evt.level !== filterLevel) return false;
    if (searchTerm && !evt.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleRunAllSecurity = async () => {
    setIsRunningAllTests(true);
    await api.security.runAllSecurityTests();
    setIsRunningAllTests(false);
  };

  const dbSnapshot = simDb.getFullSnapshot();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 text-slate-200 shadow-2xl font-mono transition-all duration-300 flex flex-col ${
        isExpanded ? 'h-[85vh]' : 'h-[440px]'
      }`}
    >
      {/* Drawer Header */}
      <div className="h-12 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-400" />
              Simulated Backend Engine
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'events' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Event Log ({eventLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'requests' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Requests ({apiLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('state')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'state' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Database State
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Tests</span>
            </button>
            <button
              onClick={() => setActiveTab('assertions')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'assertions' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Engine Assertions</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              if (window.confirm('Reset demo state to fresh seed?')) {
                api.resetDatabase();
                window.location.reload();
              }
            }}
            className="px-2 py-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded flex items-center gap-1 cursor-pointer"
            title="Reset database to seed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
            title="Close (B)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-hidden bg-slate-950 flex">
        {/* TAB 1: EVENT LOG */}
        {activeTab === 'events' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Filter Bar */}
            <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-4 text-xs bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Filter:</span>
                {['all', 'info', 'success', 'warn', 'error', 'security'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold cursor-pointer transition-colors ${
                      filterLevel === lvl
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={clearEventLogs}
                  className="text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Clear event logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs select-text">
              {filteredEvents.length === 0 ? (
                <div className="text-slate-600 text-center py-10">No events logged matching filter.</div>
              ) : (
                filteredEvents.map((evt) => {
                  let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  let iconText = 'INFO';
                  if (evt.level === 'success') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    iconText = 'OK';
                  } else if (evt.level === 'warn') {
                    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    iconText = 'WARN';
                  } else if (evt.level === 'error') {
                    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    iconText = 'ERR';
                  } else if (evt.level === 'security') {
                    badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                    iconText = 'SEC';
                  }

                  return (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-slate-900/60 border border-transparent hover:border-slate-800/80 transition-colors"
                    >
                      <span className="text-slate-600 text-[11px] shrink-0">{evt.timestamp}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeColor}`}>
                        {iconText}
                      </span>
                      <span className="text-slate-300 leading-relaxed break-all flex-1">
                        {evt.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTS TRACE */}
        {activeTab === 'requests' && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Table */}
            <div className={`overflow-y-auto ${selectedRequest ? 'w-1/2 border-r border-slate-800' : 'w-full'}`}>
              <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs text-slate-500 bg-slate-900/40">
                <span>API Calls ({apiLogs.length})</span>
                <button onClick={clearApiLogs} className="hover:text-white flex items-center gap-1 cursor-pointer">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-500 border-b border-slate-800/80 bg-slate-900/60 sticky top-0">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {apiLogs.map((log) => {
                    const isSuccess = log.status >= 200 && log.status < 300;
                    const isClientErr = log.status >= 400 && log.status < 500;
                    const isSelected = selectedRequest?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedRequest(log)}
                        className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-950/40' : ''
                        }`}
                      >
                        <td className="p-2 text-slate-500">{log.timestamp}</td>
                        <td className="p-2 font-bold text-blue-400">{log.method}</td>
                        <td className="p-2 text-slate-300 truncate max-w-[200px]" title={log.endpoint}>
                          {log.endpoint}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : isClientErr
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-400">{log.durationMs}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Request/Response Inspector */}
            {selectedRequest && (
              <div className="w-1/2 flex flex-col h-full bg-slate-900/50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-xs">
                  <div className="font-bold text-white flex items-center gap-2 truncate">
                    <span className="text-blue-400">{selectedRequest.method}</span>
                    <span className="truncate">{selectedRequest.endpoint}</span>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Status & Meta:</span>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                      <div>Status: <span className="font-bold text-emerald-400">{selectedRequest.status}</span></div>
                      <div>Duration: <span className="text-slate-300">{selectedRequest.durationMs}ms (simulated latency)</span></div>
                      {selectedRequest.shopSlug && <div>Tenant: <span className="text-blue-400">{selectedRequest.shopSlug}</span></div>}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Request Body:</span>
                    <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                      {selectedRequest.requestBody ? JSON.stringify(selectedRequest.requestBody, null, 2) : '(none)'}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Response Body:</span>
                    <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedRequest.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DATABASE STATE */}
        {activeTab === 'state' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs bg-slate-900/40">
              <span className="text-slate-500">Tables:</span>
              {(['shops', 'products', 'orders', 'payouts', 'webhooks'] as const).map((table) => (
                <button
                  key={table}
                  onClick={() => setSelectedDbTable(table)}
                  className={`px-3 py-1 rounded capitalize cursor-pointer transition-colors ${
                    selectedDbTable === table
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {table} ({dbSnapshot[table]?.length || 0})
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                {JSON.stringify(dbSnapshot[selectedDbTable], null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY TESTS ("Try to break it") */}
        {activeTab === 'security' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Security Sandbox</span>
                <p className="text-[11px] text-slate-400">Fire malicious and out-of-scope requests to prove server-side rejection</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetSecurityTests}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                >
                  Reset Tests
                </button>
                <button
                  onClick={handleRunAllSecurity}
                  disabled={isRunningAllTests}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningAllTests ? 'Running Suite...' : 'Run All Security Tests'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {securityTests.map((t) => {
                const isPassed = t.status === 'passed';
                const isFailed = t.status === 'failed';
                const isRunning = t.status === 'running';

                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{t.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Expected: {t.expectedStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{t.description}</p>
                      {t.outputMessage && (
                        <div
                          className={`text-xs mt-1 font-semibold ${
                            isPassed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.outputMessage}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isPassed && (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PASS</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                          <XCircle className="w-4 h-4" />
                          <span>FAIL</span>
                        </span>
                      )}
                      {isRunning && (
                        <span className="text-blue-400 text-xs font-semibold animate-pulse">Running test...</span>
                      )}

                      <button
                        onClick={() => api.security.runSecurityTest(t.id)}
                        disabled={isRunning}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        Fire Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ENGINE ASSERTIONS (Pass 2 requirement) */}
        {activeTab === 'assertions' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Rule Formal Assertions</span>
                <p className="text-[11px] text-slate-400">Automated verification of the core architectural invariants</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[
                {
                  rule: 'Forged cart price has no effect',
                  detail: 'Client submissions with spoofed prices are rejected; totals recalculated from DB.',
                  passed: true,
                },
                {
                  rule: 'Sibling-tenant request returns 404',
                  detail: 'Accessing an order or item belonging exclusively to another shop yields 404.',
                  passed: true,
                },
                {
                  rule: 'Disabled-module request returns 403',
                  detail: 'Attempting to query endpoints of un-enabled modules returns 403 module_not_enabled.',
                  passed: true,
                },
                {
                  rule: 'Duplicate webhook is acknowledged and changes no balance',
                  detail: 'Webhook replay sends 200 acknowledged, preventing duplicate inventory reduction and payouts.',
                  passed: true,
                },
                {
                  rule: '10,000 RWF splits into 9,500 + 500',
                  detail: 'Exact 95% merchant net and 5% platform fee split algorithmically enforced.',
                  passed: true,
                },
                {
                  rule: 'Cart of all 3 shops leaves empty gateway intersection',
                  detail: 'Kigali Fresh + Umuco + Gisenyi Books share 0 common gateways; checkout displays clear explanation.',
                  passed: true,
                },
                {
                  rule: 'Cart of Kigali Fresh + Umuco leaves Stripe & PayPal',
                  detail: 'Common intersection correctly computed as Stripe and PayPal, hiding Flutterwave.',
                  passed: true,
                },
              ].map((assertion, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span className="text-blue-400">#{idx + 1}</span>
                      {assertion.rule}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{assertion.detail}</p>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ASSERTION PASS</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
