import React from 'react';
import './FocusFactorCalculator.css';

function FocusFactorCalculator({ employees, setEmployees, config }) {

    // Pure function to calculate metrics from sprint data
    const calculateMetrics = (sprints) => {
        const validSprints = sprints.filter(s =>
            !s.excludeFromCalculation &&
            s.availableDays > 0
        );

        let focusFactor = 0.8; // default
        let trend = '→';

        if (validSprints.length > 0) {
            const recentSprints = validSprints;

            const totalActual = recentSprints.reduce((sum, s) => sum + s.actualSP, 0);
            const totalDays = recentSprints.reduce((sum, s) => sum + s.availableDays, 0);

            focusFactor = totalDays > 0 ? totalActual / totalDays : 0.8;
            focusFactor = Math.max(0, focusFactor);

            if (validSprints.length >= 2) {
                const lastSprint = validSprints[validSprints.length - 1];
                const lastK = lastSprint.availableDays > 0
                    ? lastSprint.actualSP / lastSprint.availableDays
                    : 0;

                if (lastK > focusFactor * 1.1) trend = '↑';
                else if (lastK < focusFactor * 0.9) trend = '↓';
            }
        }

        return { focusFactor, trend };
    };

    const updateHistoricalData = (employeeId, sprintIndex, field, value) => {
        setEmployees(prevEmployees => prevEmployees.map(emp => {
            if (emp.id !== employeeId) return emp;

            // Ensure historical data exists and has 5 items
            let currentSprints = emp.historicalData && emp.historicalData.length > 0
                ? [...emp.historicalData]
                : Array(5).fill(null).map((_, i) => ({
                    sprintName: `Sprint ${i + 1}`,
                    actualSP: 0,
                    availableDays: 0,
                    excludeFromCalculation: false
                }));

            // Expand if for some reason shorter than 5 (though unlikely with above logic)
            if (currentSprints.length < 5) {
                const expanded = Array(5).fill(null).map((_, i) => currentSprints[i] || {
                    sprintName: `Sprint ${i + 1}`,
                    actualSP: 0,
                    availableDays: 0,
                    excludeFromCalculation: false
                });
                currentSprints = expanded;
            }

            // Create new sprint object
            const updatedSprint = { ...currentSprints[sprintIndex] };

            if (field === 'excludeFromCalculation') {
                updatedSprint[field] = value;
            } else if (field === 'sprintName') {
                updatedSprint[field] = value;
            } else {
                updatedSprint[field] = parseFloat(value) || 0;
            }

            currentSprints[sprintIndex] = updatedSprint;

            // Recalculate metrics
            const { focusFactor, trend } = calculateMetrics(currentSprints);

            return {
                ...emp,
                historicalData: currentSprints,
                focusFactor,
                trend
            };
        }));
    };

    return (
        <div className="focus-calculator-wrapper">
            <div className="card focus-calculator">
                <div className="calculator-header">
                    <div>
                        <h2>⚡️ Average SP/Day Calculator</h2>
                        <p className="calculator-description">
                            Enter actual story points and available days for the last 5 sprints.
                            SP/Day = Actual SP / Available Days (individual velocity)
                        </p>
                        <p className="calculator-note">
                            💡 Using average of all included sprints
                        </p>
                    </div>
                </div>

                <div className="employee-calculators">
                    {employees.map(emp => {
                        // Prepare display data (auto-fill if missing)
                        const empData = emp.historicalData && emp.historicalData.length > 0
                            ? emp.historicalData
                            : Array(5).fill(null).map((_, i) => ({
                                sprintName: `Sprint ${i + 1}`,
                                actualSP: 0,
                                availableDays: 0,
                                excludeFromCalculation: false
                            }));

                        const validSprints = empData.filter(s => !s.excludeFromCalculation && s.availableDays > 0);
                        const window = config?.rollingAverageWindow || 3;
                        const recentSprints = validSprints.slice(-window);

                        const totalActual = recentSprints.reduce((sum, s) => sum + s.actualSP, 0);
                        const totalDays = recentSprints.reduce((sum, s) => sum + s.availableDays, 0);

                        const hasWarnings = empData.some(s =>
                            s.availableDays > 0 && s.actualSP > (s.availableDays * 2)
                        );

                        return (
                            <div key={emp.id} className="employee-calculator">
                                <div className="employee-header">
                                    <div className="employee-info">
                                        <span className="employee-name">{emp.name}</span>
                                        {emp.role && emp.role !== 'developer' && (
                                            <span className={`role-badge ${emp.role}`}>
                                                {emp.role === 'scrumMaster' ? 'SM' :
                                                    emp.role === 'productOwner' ? 'PO' : emp.role}
                                            </span>
                                        )}
                                    </div>
                                    <div className="focus-badge">
                                        <span className="k-label">SP/Day =</span>
                                        <span className="k-value">{emp.focusFactor.toFixed(2)}</span>
                                        {emp.trend && <span className="trend-arrow">{emp.trend}</span>}
                                        {hasWarnings && <span className="warning-icon" title="Unusual values detected">⚠️</span>}
                                    </div>
                                </div>

                                <div className="sprint-data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sprint</th>
                                                <th>Actual SP</th>
                                                <th>Available Days</th>
                                                <th>SP/Day</th>
                                                <th>Exclude</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {empData.map((sprint, idx) => {
                                                const sprintK = sprint.availableDays > 0
                                                    ? sprint.actualSP / sprint.availableDays
                                                    : 0;
                                                const isUnusual = sprint.availableDays > 0 &&
                                                    sprint.actualSP > (sprint.availableDays * 2);

                                                return (
                                                    <tr key={idx} className={sprint.excludeFromCalculation ? 'excluded' : ''}>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={sprint.sprintName}
                                                                onChange={(e) => updateHistoricalData(emp.id, idx, 'sprintName', e.target.value)}
                                                                className="sprint-name-input"
                                                                placeholder={`Sprint ${idx + 1}`}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={sprint.actualSP || ''}
                                                                onChange={(e) => updateHistoricalData(emp.id, idx, 'actualSP', e.target.value)}
                                                                min="0"
                                                                step="0.5"
                                                                className={isUnusual ? 'warning' : ''}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={sprint.availableDays || ''}
                                                                onChange={(e) => updateHistoricalData(emp.id, idx, 'availableDays', e.target.value)}
                                                                min="0"
                                                                step="0.5"
                                                            />
                                                        </td>
                                                        <td className="k-cell">
                                                            {sprintK > 0 ? sprintK.toFixed(2) : '-'}
                                                        </td>
                                                        <td className="exclude-cell">
                                                            <input
                                                                type="checkbox"
                                                                checked={sprint.excludeFromCalculation}
                                                                onChange={(e) => updateHistoricalData(emp.id, idx, 'excludeFromCalculation', e.target.checked)}
                                                                title="Exclude this sprint from calculation"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td className="total-label">Total / Avg</td>
                                                <td className="total-value">{totalActual.toFixed(1)}</td>
                                                <td className="total-value">{totalDays.toFixed(1)}</td>
                                                <td className="total-k">
                                                    <strong>{emp.focusFactor.toFixed(2)}</strong>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default FocusFactorCalculator;
