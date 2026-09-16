import React, { useState, useEffect, useCallback } from 'react';
import { OperationsShell } from '../components/operations/OperationsShell';
import { OperationalPulseView } from '../components/operations/OperationalPulseView';
import { ExceptionsCenterView } from '../components/operations/ExceptionsCenterView';
import { OperationalCommandView } from '../components/operations/OperationalCommandView';
import { ContextualWorkspaceView } from '../components/operations/ContextualWorkspaceView';
import { CommandPaletteModal } from '../components/operations/CommandPaletteModal';
import { canAccessOperationsCenter, getCurrentUser, getOperationsAuthHeaders } from '../utils/permissionUtils';
import { AccessRestrictedScreen } from '../components/common/AccessRestrictedScreen';
import { 
  OperationalCase, 
  OperationalPulseCounts, 
  OperationsMode, 
  CommandDefinition,
  OpsTheme
} from '../components/operations/types';

export const OperationsCenterPage: React.FC = () => {
  const currentUser = getCurrentUser();
  const isAuthorized = canAccessOperationsCenter(currentUser);

  if (!isAuthorized) {
    return <AccessRestrictedScreen type="operations" />;
  }

  const [currentMode, setCurrentMode] = useState<OperationsMode>('exceptions');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [theme, setTheme] = useState<OpsTheme>(() => {
    const saved = localStorage.getItem('laylah_ops_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('laylah_ops_theme', next);
      return next;
    });
  };

  const [cases, setCases] = useState<OperationalCase[]>([]);
  const [currentCase, setCurrentCase] = useState<OperationalCase | null>(null);
  const [counts, setCounts] = useState<OperationalPulseCounts | null>(null);
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync mode and filter with window.location.pathname
  const syncWithUrl = useCallback(() => {
    const path = window.location.pathname;
    setCurrentPath(path);

    if (path === '/operations/pulse' || path === '/operations/radar') {
      setCurrentMode('pulse');
      setActiveFilter(null);
    } else if (path.startsWith('/operations/workspace')) {
      setCurrentMode('workspace');
      const parts = path.split('/');
      if (parts[3]) {
        setSelectedCaseId(parts[3]);
      }
    } else if (path.startsWith('/operations/cases/')) {
      setCurrentMode('workspace');
      const parts = path.split('/');
      if (parts[3]) {
        setSelectedCaseId(parts[3]);
      }
    } else if (path.startsWith('/operations/command')) {
      setCurrentMode('command');
    } else if (path === '/operations/my-cases') {
      setCurrentMode('exceptions');
      setActiveFilter('my-cases');
    } else if (path === '/operations/unassigned') {
      setCurrentMode('exceptions');
      setActiveFilter('unassigned');
    } else if (path === '/operations/critical') {
      setCurrentMode('exceptions');
      setActiveFilter('critical');
    } else if (path === '/operations/approvals') {
      setCurrentMode('exceptions');
      setActiveFilter('approvals');
    } else if (path === '/operations/bookings') {
      setCurrentMode('exceptions');
      setActiveFilter('bookings');
    } else if (path === '/operations/financial') {
      setCurrentMode('exceptions');
      setActiveFilter('financial');
    } else if (path === '/operations/disputes') {
      setCurrentMode('exceptions');
      setActiveFilter('disputes');
    } else if (path === '/operations/escalations') {
      setCurrentMode('exceptions');
      setActiveFilter('escalations');
    } else if (path === '/operations/sla') {
      setCurrentMode('exceptions');
      setActiveFilter('sla');
    } else if (path === '/operations/closed') {
      setCurrentMode('exceptions');
      setActiveFilter('closed');
    } else {
      setCurrentMode('exceptions');
      setActiveFilter(null);
    }
  }, []);

  useEffect(() => {
    syncWithUrl();
    window.addEventListener('popstate', syncWithUrl);
    return () => window.removeEventListener('popstate', syncWithUrl);
  }, [syncWithUrl]);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch summary counts
  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/operations/summary', {
        headers: getOperationsAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch commands registry
  const fetchCommands = async () => {
    try {
      const res = await fetch('/api/operations/commands', {
        headers: getOperationsAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch cases with active filter
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      let url = '/api/operations/cases';
      if (activeFilter) {
        url += `?filter=${encodeURIComponent(activeFilter)}`;
      }
      const res = await fetch(url, {
        headers: getOperationsAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        setLastUpdated(new Date());

        // If there's an active caseId selected, refresh it or select first
        if (selectedCaseId) {
          fetchCaseDetails(selectedCaseId);
        } else if (data.cases && data.cases.length > 0 && !currentCase) {
          setCurrentCase(data.cases[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single case details with activities
  const fetchCaseDetails = async (caseId: string) => {
    try {
      const res = await fetch(`/api/operations/cases/${caseId}`, {
        headers: getOperationsAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentCase(data.case);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchSummary();
    fetchCommands();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [activeFilter]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Navigate mode
  const handleSelectMode = (mode: OperationsMode) => {
    setCurrentMode(mode);
    let targetUrl = '/operations/inbox';
    if (mode === 'pulse') {
      targetUrl = '/operations/pulse';
    } else if (mode === 'exceptions') {
      targetUrl = activeFilter ? `/operations/${activeFilter}` : '/operations/inbox';
    } else if (mode === 'command') {
      targetUrl = '/operations/command';
    } else if (mode === 'workspace') {
      const targetCaseId = selectedCaseId || (cases.length > 0 ? cases[0].caseId : null);
      if (targetCaseId && !selectedCaseId) {
        setSelectedCaseId(targetCaseId);
        fetchCaseDetails(targetCaseId);
      }
      targetUrl = targetCaseId ? `/operations/workspace/${targetCaseId}` : '/operations/workspace';
    }
    setCurrentPath(targetUrl);
    window.history.pushState({}, '', targetUrl);
  };

  // Filter selection in exceptions center
  const handleSelectFilter = (filter: string | null) => {
    setActiveFilter(filter);
    const targetUrl = filter ? `/operations/${filter}` : '/operations/inbox';
    setCurrentPath(targetUrl);
    window.history.pushState({}, '', targetUrl);
  };

  // Unified navigation callback from sidebar
  const handleNavigate = (path: string, filter: string | null, mode: OperationsMode) => {
    setCurrentMode(mode);
    setActiveFilter(filter);
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    if (mode === 'workspace' && !selectedCaseId && cases.length > 0) {
      setSelectedCaseId(cases[0].caseId);
    }
  };

  // Transition from exceptions or search into workspace
  const handleOpenInWorkspace = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentMode('workspace');
    const targetUrl = `/operations/workspace/${caseId}`;
    setCurrentPath(targetUrl);
    window.history.pushState({}, '', targetUrl);
    fetchCaseDetails(caseId);
  };

  // Execute Operational Command
  const handleExecuteCommand = async (commandId: string, caseId: string, payload: any = {}) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/operations/commands/${commandId}/execute`, {
        method: 'POST',
        headers: getOperationsAuthHeaders(),
        body: JSON.stringify({ caseId, payload })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'فشل تنفيذ الأمر التشغيلي.');
        return;
      }

      // Success
      await fetchSummary();
      await fetchCases();
      if (selectedCaseId === caseId || currentCase?.caseId === caseId) {
        await fetchCaseDetails(caseId);
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء الاتصال بالخادم: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  // Run Automated Discovery
  const handleRunDiscovery = async () => {
    try {
      setIsRunningDiscovery(true);
      const res = await fetch('/api/operations/commands/TRIGGER_EXCEPTION_DISCOVERY/execute', {
        method: 'POST',
        headers: getOperationsAuthHeaders(),
        body: JSON.stringify({ caseId: 'SYSTEM' })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSummary();
        await fetchCases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  // Create Case
  const handleCreateCase = async (formData: any) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/operations/cases', {
        method: 'POST',
        headers: getOperationsAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.case) {
        await fetchSummary();
        await fetchCases();
        handleOpenInWorkspace(data.case.caseId);
      } else {
        alert(data.error || 'فشل إنشاء الحالة التشغيلية.');
      }
    } catch (err: any) {
      alert('خطأ أثناء إنشاء الحالة: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OperationsShell
      currentMode={currentMode}
      onSelectMode={handleSelectMode}
      currentPath={currentPath}
      activeFilter={activeFilter}
      counts={counts}
      isLoading={isLoading}
      onRefresh={() => {
        fetchSummary();
        fetchCases();
      }}
      lastUpdated={lastUpdated}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      onNavigate={handleNavigate}
      onRunDiscovery={handleRunDiscovery}
      isRunningDiscovery={isRunningDiscovery}
      activeCaseId={selectedCaseId || currentCase?.caseId}
      userRole="مشرف العمليات"
      userName="عبدالله السبيعي"
      theme={theme}
      onToggleTheme={handleToggleTheme}
    >
      {/* Mode 1: Operational Pulse / Radar */}
      {currentMode === 'pulse' && (
        <OperationalPulseView
          counts={counts}
          cases={cases}
          onNavigateToQueue={(filter) => handleNavigate(`/operations/${filter}`, filter, 'exceptions')}
          onOpenCase={handleOpenInWorkspace}
          onRunDiscovery={handleRunDiscovery}
          isRunningDiscovery={isRunningDiscovery}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          theme={theme}
        />
      )}

      {/* Mode 2: Exceptions Center */}
      {currentMode === 'exceptions' && (
        <ExceptionsCenterView
          cases={cases}
          counts={counts}
          activeFilter={activeFilter}
          onSelectFilter={handleSelectFilter}
          onOpenInWorkspace={handleOpenInWorkspace}
          onExecuteCommand={handleExecuteCommand}
          theme={theme}
        />
      )}

      {/* Mode 3: Operational Command & Search */}
      {currentMode === 'command' && (
        <OperationalCommandView
          commands={commands}
          cases={cases}
          onSelectCase={handleOpenInWorkspace}
          onExecuteCommand={handleExecuteCommand}
          onCreateCase={handleCreateCase}
          theme={theme}
        />
      )}

      {/* Mode 4: Contextual Workspace (3-Pane) */}
      {currentMode === 'workspace' && (
        <ContextualWorkspaceView
          currentCase={currentCase}
          allCases={cases}
          onSelectCase={handleOpenInWorkspace}
          onExecuteCommand={handleExecuteCommand}
          onRefreshCase={fetchCaseDetails}
          theme={theme}
        />
      )}

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectCase={handleOpenInWorkspace}
        onExecuteCommand={handleExecuteCommand}
        activeCase={currentCase}
        commands={commands}
        theme={theme}
      />
    </OperationsShell>
  );
};

export default OperationsCenterPage;
