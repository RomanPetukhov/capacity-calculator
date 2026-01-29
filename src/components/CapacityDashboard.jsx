import { useMemo, useState } from 'react';
import './CapacityDashboard.css';

function CapacityDashboard({ employees, sprints, config, setConfig, vacations, calculationMethod, teamVelocity, onUpdateSprint }) {
    const [sprintRoundingMode, setSprintRoundingMode] = useState('floor'); // for sprint cards
    const [netRoundingMode, setNetRoundingMode] = useState('floor'); // for net capacity table

    const applyRounding = (value, mode) => {
        switch (mode) {
            case 'floor':
                return Math.floor(value);
            case 'round':
                return Math.round(value);
            case 'ceil':
                return Math.ceil(value);
            case 'none':
            default:
                return value;
        }
    };

    const formatValue = (value, mode) => {
        if (mode === 'none') {
            return value.toFixed(1);
        }
        return applyRounding(value, mode).toString();
    };

    const calculations = useMemo(() => {
        const getVacationDays = (employeeId, sprintId) => {
            return vacations[`${employeeId}_${sprintId}`] || 0;
        };

        // Calculate capacity for each employee per sprint
        const employeeSprintCapacity = employees.map(emp => ({
            employee: emp,
            sprints: sprints.map(sprint => {
                const vacationDays = getVacationDays(emp.id, sprint.id);
                const effectiveDays = sprint.totalWorkingDays - vacationDays;

                let capacity = 0;

                if (calculationMethod === 'velocity') {
                    // Global Team Velocity Distribution (SP per Day)
                    const teamSize = employees.length;

                    if (teamSize > 0) {
                        // 1. Calculate Daily Velocity per person
                        // Input teamVelocity is already SP/Day for the whole team
                        const velocityPerPersonPerDay = teamVelocity / teamSize;

                        // 2. Apply to effective days
                        capacity = effectiveDays * velocityPerPersonPerDay;
                    }
                } else {
                    // Default: Focus Factor
                    capacity = effectiveDays * emp.focusFactor;
                }

                // Apply global adjustment (default 0.8)
                capacity *= (config.commonSprintFactor !== undefined ? config.commonSprintFactor : 0.8);

                return {
                    sprint,
                    vacationDays,
                    effectiveDays,
                    capacity
                };
            })
        }));

        // Calculate total capacity per sprint
        const sprintTotals = sprints.map(sprint => {
            const totalCapacity = employees.reduce((sum, emp) => {
                const vacationDays = getVacationDays(emp.id, sprint.id);
                const effectiveDays = sprint.totalWorkingDays - vacationDays;

                let capacity = 0;
                if (calculationMethod === 'velocity') {
                    const teamSize = employees.length;
                    if (teamSize > 0) {
                        const velocityPerPersonPerDay = teamVelocity / teamSize;
                        capacity = effectiveDays * velocityPerPersonPerDay;
                    }
                } else {
                    capacity = effectiveDays * emp.focusFactor;
                }

                // Apply global adjustment (default 0.8)
                capacity *= (config.commonSprintFactor !== undefined ? config.commonSprintFactor : 0.8);

                return sum + capacity;
            }, 0);

            const getPct = (key) => sprint[key] !== undefined ? sprint[key] : config[key];

            return {
                sprint,
                totalCapacity,
                bugs: totalCapacity * (getPct('bugPct') / 100),
                committed: totalCapacity * (getPct('committedPct') / 100),
                uncommitted: totalCapacity * (getPct('uncommittedPct') / 100),
                future: totalCapacity * (getPct('enablersPct') / 100),
                techDebt: totalCapacity * (getPct('techDebtPct') / 100),
            };
        });

        return { employeeSprintCapacity, sprintTotals };
    }, [employees, sprints, config, vacations, calculationMethod, teamVelocity]);

    const totalCapacityAllSprints = calculations.sprintTotals.reduce((sum, st) => sum + st.totalCapacity, 0);

    // Calculate Team SP/Day
    const baseTeamSP = calculationMethod === 'velocity'
        ? teamVelocity
        : employees.reduce((sum, e) => sum + e.focusFactor, 0);
    const adjustedTeamSP = baseTeamSP * (config.commonSprintFactor !== undefined ? config.commonSprintFactor : 0.8);

    const renderAllocationItem = (sprint, label, icon, configKey, amount, colorClass) => {
        const pct = sprint[configKey] !== undefined ? sprint[configKey] : config[configKey];
        return (
            <div className="allocation-item">
                <div className="allocation-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span className="allocation-label">{icon} {label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="number"
                                className="pct-input"
                                value={pct}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    onUpdateSprint({ ...sprint, [configKey]: isNaN(val) ? 0 : val });
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>%</span>
                            <span className="allocation-value" style={{ marginLeft: '4px' }}>{formatValue(amount, sprintRoundingMode)}</span>
                        </div>
                    </div>
                </div>
                <div className="allocation-bar">
                    <div
                        className={`allocation-fill ${colorClass}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="card capacity-dashboard">
            <h2>📊 Capacity Dashboard</h2>
            <p className="dashboard-description">Team capacity breakdown by sprint and allocation category</p>

            {/* Employee Breakdown Table - Gross Capacity */}
            <div className="employee-breakdown">
                <h3>Team Member Breakdown - Gross Capacity</h3>
                <p className="table-description">Total capacity with vacation and focus factor applied</p>
                <div className="table-container">
                    <table className="breakdown-table">
                        <thead>
                            <tr>
                                <th>Team Member</th>
                                <th>{calculationMethod === 'velocity' ? 'Daily Share' : 'SP/Day'}</th>
                                {sprints.map(sprint => (
                                    <th key={sprint.id}>{sprint.name}</th>
                                ))}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculations.employeeSprintCapacity.map(({ employee, sprints: empSprints }) => (
                                <tr key={employee.id}>
                                    <td className="employee-name">{employee.name}</td>
                                    <td className="focus-factor">
                                        {calculationMethod === 'velocity'
                                            ? (employees.length > 0 ? (teamVelocity / employees.length).toFixed(1) : '0.0')
                                            : employee.focusFactor.toFixed(2)
                                        }
                                    </td>
                                    {empSprints.map(({ sprint, capacity }) => (
                                        <td key={sprint.id} className="capacity-cell">
                                            {capacity.toFixed(1)}
                                        </td>
                                    ))}
                                    <td className="total-cell">
                                        {empSprints.reduce((sum, s) => sum + s.capacity, 0).toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2">Total Capacity</td>
                                {calculations.sprintTotals.map(({ sprint, totalCapacity }) => (
                                    <td key={sprint.id} className="total-cell">
                                        {totalCapacity.toFixed(1)}
                                    </td>
                                ))}
                                <td className="grand-total-cell">
                                    {totalCapacityAllSprints.toFixed(1)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Sprint Summary Cards */}
            <div className="sprint-cards-section highlighted-section">
                <div className="sprint-cards-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h3>Sprint Allocation Breakdown</h3>

                        <div className="factor-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label className="rounding-label">Correction Factor:</label>
                            <div className="factor-control">
                                <span className="factor-prefix">x</span>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    className="factor-input"
                                    value={config.commonSprintFactor !== undefined ? config.commonSprintFactor : 0.8}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setConfig({ ...config, commonSprintFactor: isNaN(val) ? 0.8 : val });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="team-sp-display" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="rounding-label">Team SP/Day:</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                                {adjustedTeamSP.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="rounding-selector">
                        <label className="rounding-label">Rounding Mode:</label>
                        <select
                            value={sprintRoundingMode}
                            onChange={(e) => setSprintRoundingMode(e.target.value)}
                            className="rounding-select"
                        >
                            <option value="floor">Round Down (SAFe Recommended)</option>
                            <option value="round">Round to Nearest</option>
                            <option value="ceil">Round Up</option>
                            <option value="none">No Rounding</option>
                        </select>
                    </div>
                </div>
                <div className="sprint-cards">
                    {calculations.sprintTotals.map(({ sprint, totalCapacity, bugs, committed, uncommitted, future, techDebt }) => (
                        <div key={sprint.id} className="sprint-card">
                            <div className="sprint-card-header">
                                <h3>{sprint.name}</h3>
                                <div className="capacity-badge">{formatValue(totalCapacity, sprintRoundingMode)} SP</div>


                            </div>

                            <div className="allocation-bars">
                                {renderAllocationItem(sprint, 'Bugs', '🐛', 'bugPct', bugs, 'bugs')}
                                {renderAllocationItem(sprint, 'Committed', '✅', 'committedPct', committed, 'committed')}
                                {config.uncommittedEnabled && renderAllocationItem(sprint, 'Uncommitted', '📄', 'uncommittedPct', uncommitted, 'uncommitted')}
                                {renderAllocationItem(sprint, 'Enablers', '🔮', 'enablersPct', future, 'future')}
                                {renderAllocationItem(sprint, 'Tech Debt', '🔧', 'techDebtPct', techDebt, 'techdebt')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee Net Capacity Table - After Maintenance & Tech Debt */}
            <div className="employee-breakdown net-capacity-section highlighted-section">
                <div className="net-capacity-header">
                    <div>
                        <h3>Team Member Breakdown - Net Capacity</h3>
                        <p className="table-description">
                            Capacity after deducting bugs (varies) and {config.techDebtPct}% for tech debt
                        </p>
                    </div>
                    <div className="rounding-selector">
                        <label className="rounding-label">Rounding Mode:</label>
                        <select
                            value={netRoundingMode}
                            onChange={(e) => setNetRoundingMode(e.target.value)}
                            className="rounding-select"
                        >
                            <option value="floor">Round Down (SAFe Recommended)</option>
                            <option value="round">Round to Nearest</option>
                            <option value="ceil">Round Up</option>
                            <option value="none">No Rounding</option>
                        </select>
                    </div>
                </div>
                <div className="table-container">
                    <table className="breakdown-table net-capacity-table">
                        <thead>
                            <tr>
                                <th>Team Member</th>
                                <th>{calculationMethod === 'velocity' ? 'Daily Share' : 'SP/Day'}</th>
                                {sprints.map(sprint => (
                                    <th key={sprint.id}>{sprint.name}</th>
                                ))}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculations.employeeSprintCapacity.map(({ employee, sprints: empSprints }) => {
                                const maintenancePct = (config.bugPct + config.techDebtPct) / 100;
                                return (
                                    <tr key={employee.id}>
                                        <td className="employee-name">{employee.name}</td>
                                        <td className="focus-factor">
                                            {calculationMethod === 'velocity'
                                                ? (employees.length > 0 ? (teamVelocity / employees.length).toFixed(1) : '0.0')
                                                : employee.focusFactor.toFixed(2)
                                            }
                                        </td>
                                        {empSprints.map(({ sprint, capacity }) => {
                                            const bugPct = sprint.bugPct !== undefined ? sprint.bugPct : config.bugPct;
                                            const techDebtPct = sprint.techDebtPct !== undefined ? sprint.techDebtPct : config.techDebtPct;
                                            const maintenancePct = (bugPct + techDebtPct) / 100;
                                            const netCapacity = capacity * (1 - maintenancePct);
                                            return (
                                                <td key={sprint.id} className="capacity-cell net-capacity">
                                                    {formatValue(netCapacity, netRoundingMode)}
                                                </td>
                                            );
                                        })}
                                        <td className="total-cell">
                                            {formatValue(empSprints.reduce((sum, { sprint, capacity }) => {
                                                const bugPct = sprint.bugPct !== undefined ? sprint.bugPct : config.bugPct;
                                                const techDebtPct = sprint.techDebtPct !== undefined ? sprint.techDebtPct : config.techDebtPct;
                                                const maintPct = (bugPct + techDebtPct) / 100;
                                                return sum + (capacity * (1 - maintPct));
                                            }, 0), netRoundingMode)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2">Total Net Capacity</td>
                                {calculations.sprintTotals.map(({ sprint, totalCapacity }) => {
                                    const bugPct = sprint.bugPct !== undefined ? sprint.bugPct : config.bugPct;
                                    const maintenancePct = (bugPct + config.techDebtPct) / 100;
                                    const netCapacity = totalCapacity * (1 - maintenancePct);
                                    return (
                                        <td key={sprint.id} className="total-cell">
                                            {formatValue(netCapacity, netRoundingMode)}
                                        </td>
                                    );
                                })}
                                <td className="grand-total-cell">
                                    {formatValue(calculations.sprintTotals.reduce((sum, { sprint, totalCapacity }) => {
                                        const bugPct = sprint.bugPct !== undefined ? sprint.bugPct : config.bugPct;
                                        const techDebtPct = sprint.techDebtPct !== undefined ? sprint.techDebtPct : config.techDebtPct;
                                        const maintPct = (bugPct + techDebtPct) / 100;
                                        return sum + (totalCapacity * (1 - maintPct));
                                    }, 0), netRoundingMode)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CapacityDashboard;
