import { useState, useEffect } from 'react';
import './App.css';
import TeamManager from './components/TeamManager';
import FocusFactorCalculator from './components/FocusFactorCalculator';
import ConfigPanel from './components/ConfigPanel';
import SprintManager from './components/SprintManager';
import VacationMatrix from './components/VacationMatrix';
import CapacityDashboard from './components/CapacityDashboard';
import { exportToExcel } from './utils/excelExport';

// Initial data based on the spreadsheet
const initialEmployees = [
  {
    id: 1,
    name: 'Sasha',
    focusFactor: 0.8, // SAFe default
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
  {
    id: 2,
    name: 'Dima',
    focusFactor: 0.8,
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
  {
    id: 3,
    name: 'Olya',
    focusFactor: 0.8,
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
  {
    id: 4,
    name: 'Misha',
    focusFactor: 0.8,
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
  {
    id: 5,
    name: 'Igor',
    focusFactor: 0.8,
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
  {
    id: 6,
    name: 'Petr',
    focusFactor: 0.8,
    role: 'developer',
    participatesInDevelopment: true,
    historicalData: []
  },
];

const initialSprints = [
  {
    id: 1,
    name: 'Sprint 1',
    startDate: '2025-01-13',
    endDate: '2025-01-24',
    calculatedDays: 10,
    manualDays: 9,
    totalWorkingDays: 9
  },
  {
    id: 2,
    name: 'Sprint 2',
    startDate: '2025-01-27',
    endDate: '2025-02-07',
    calculatedDays: 10,
    manualDays: 8,
    totalWorkingDays: 8
  },
  {
    id: 3,
    name: 'Sprint 3',
    startDate: '2025-02-10',
    endDate: '2025-02-21',
    calculatedDays: 10,
    manualDays: 10,
    totalWorkingDays: 10
  },
  {
    id: 4,
    name: 'Sprint 4',
    startDate: '2025-02-24',
    endDate: '2025-03-07',
    calculatedDays: 10,
    manualDays: 10,
    totalWorkingDays: 10
  },
  {
    id: 5,
    name: 'Sprint 5',
    startDate: '2025-03-10',
    endDate: '2025-03-21',
    calculatedDays: 10,
    manualDays: 9,
    totalWorkingDays: 9
  },
];

const initialConfig = {
  bugPct: 15,
  committedPct: 60, // Increased to account for removed uncommitted
  enablersPct: 20, // Renamed from futurePct
  techDebtPct: 5,
  historicalIncludesMaintenanceWork: false, // Prevent double-buffering
  rollingAverageWindow: 3, // Calculate K from last 3 sprints
  calculationMode: 'productivity', // 'productivity' (K-based) or 'days' (for new teams)
  commonSprintFactor: 0.8, // Global adjustment factor
};

function App() {
  // Load state from localStorage or use defaults
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('cc_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });
  const [sprints, setSprints] = useState(() => {
    const saved = localStorage.getItem('cc_sprints');
    return saved ? JSON.parse(saved) : initialSprints;
  });
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('cc_config');
    // Merge with initialConfig to ensure new keys exist
    return saved ? { ...initialConfig, ...JSON.parse(saved) } : initialConfig;
  });
  const [vacations, setVacations] = useState(() => {
    const saved = localStorage.getItem('cc_vacations');
    return saved ? JSON.parse(saved) : {};
  });
  const [calculationMethod, setCalculationMethod] = useState(() => {
    const saved = localStorage.getItem('cc_calculationMethod');
    return saved ? JSON.parse(saved) : 'velocity';
  });
  const [teamVelocity, setTeamVelocity] = useState(() => {
    const saved = localStorage.getItem('cc_teamVelocity');
    return saved ? JSON.parse(saved) : 0;
  });
  const [focusFactorSource, setFocusFactorSource] = useState(() => {
    const saved = localStorage.getItem('cc_focusFactorSource');
    return saved ? JSON.parse(saved) : 'manual';
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('cc_employees', JSON.stringify(employees));
    localStorage.setItem('cc_sprints', JSON.stringify(sprints));
    localStorage.setItem('cc_config', JSON.stringify(config));
    localStorage.setItem('cc_vacations', JSON.stringify(vacations));
    localStorage.setItem('cc_calculationMethod', JSON.stringify(calculationMethod));
    localStorage.setItem('cc_teamVelocity', JSON.stringify(teamVelocity));
    localStorage.setItem('cc_focusFactorSource', JSON.stringify(focusFactorSource));
  }, [employees, sprints, config, vacations, calculationMethod, teamVelocity, focusFactorSource]);

  // Prompt before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Save state to JSON file
  const handleSave = () => {
    const state = {
      employees,
      sprints,
      config,
      vacations,
      calculationMethod,
      teamVelocity,
      savedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `capacity-calculator-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load state from JSON file
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);

          // Restore state
          if (state.employees) setEmployees(state.employees);
          if (state.sprints) setSprints(state.sprints);
          if (state.config) setConfig(state.config);
          if (state.vacations) setVacations(state.vacations);
          if (state.calculationMethod) setCalculationMethod(state.calculationMethod);
          if (state.teamVelocity !== undefined) setTeamVelocity(state.teamVelocity);

          alert('Data loaded successfully!');
        } catch (error) {
          alert('Error loading file. Please check the file format.');
          console.error('Load error:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Export to Excel with formulas
  const handleExportExcel = () => {
    try {
      exportToExcel(employees, sprints, config, vacations, calculationMethod, teamVelocity);
    } catch (error) {
      alert('Error exporting to Excel. Please try again.');
      console.error('Excel export error:', error);
    }
  };

  // Update sprint from dashboard (factor)
  const handleUpdateSprint = (updatedSprint) => {
    setSprints(prevSprints => prevSprints.map(s => s.id === updatedSprint.id ? updatedSprint : s));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="gradient-text">Capacity Calculator</h1>
          <p className="header-subtitle">Team capacity planning and allocation • Synced with Antigravity</p>
        </div>
        <div className="header-controls">
          <button className="action-btn" onClick={handleSave}>
            💾 Save
          </button>
          <button className="action-btn primary" onClick={handleExportExcel}>
            📊 Export to Excel
          </button>
          <button className="action-btn" onClick={handleLoad}>
            📂 Load
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* Configuration and Sprint Management - Top Section */}
        <div className="layout-grid">
          <section className="section">
            <ConfigPanel
              config={config}
              setConfig={setConfig}
              calculationMethod={calculationMethod}
              setCalculationMethod={setCalculationMethod}
              focusFactorSource={focusFactorSource}
              setFocusFactorSource={setFocusFactorSource}
              teamVelocity={teamVelocity}
              setTeamVelocity={setTeamVelocity}
            />
          </section>

          <section className="section">
            <SprintManager
              sprints={sprints}
              setSprints={setSprints}
            />
          </section>
        </div>

        {/* Focus Factor Calculator - Only if method is focusFactor */}
        {calculationMethod === 'focusFactor' && (
          <FocusFactorCalculator
            employees={employees}
            setEmployees={setEmployees}
            config={config}
            focusFactorSource={focusFactorSource}
          />
        )}

        {/* Team Members */}
        <TeamManager
          employees={employees}
          setEmployees={setEmployees}
          calculationMethod={calculationMethod}
        />

        {/* Capacity Planning Sections */}
        <div className="layout-grid">
          {/* Vacations and Dashboard */}
          <section className="section section-full">
            <VacationMatrix
              employees={employees}
              sprints={sprints}
              vacations={vacations}
              setVacations={setVacations}
            />
          </section>

          <section className="section section-full">
            <CapacityDashboard
              employees={employees}
              sprints={sprints}
              config={config}
              setConfig={setConfig}
              vacations={vacations}
              calculationMethod={calculationMethod}
              teamVelocity={teamVelocity}
              onUpdateSprint={handleUpdateSprint}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
