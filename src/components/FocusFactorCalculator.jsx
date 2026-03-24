import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { translations as allTranslations } from '../translations';
import './FocusFactorCalculator.css';

function FocusFactorCalculator({ employees, setEmployees, config, focusFactorSource }) {
    const language = 'ru';
    const translations = allTranslations[language];
    
    const [tempoFile, setTempoFile] = useState(null);
    const [jiraFile, setJiraFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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

            // Expand if for some reason shorter than 5
            if (currentSprints.length < 5) {
                const expanded = Array(5).fill(null).map((_, i) => currentSprints[i] || {
                    sprintName: `Sprint ${i + 1}`,
                    actualSP: 0,
                    availableDays: 0,
                    excludeFromCalculation: false
                });
                currentSprints = expanded;
            }

            const updatedSprint = { ...currentSprints[sprintIndex] };

            if (field === 'excludeFromCalculation') {
                updatedSprint[field] = value;
            } else if (field === 'sprintName') {
                updatedSprint[field] = value;
            } else {
                updatedSprint[field] = parseFloat(value) || 0;
            }

            currentSprints[sprintIndex] = updatedSprint;

            const { focusFactor, trend } = calculateMetrics(currentSprints);

            return {
                ...emp,
                historicalData: currentSprints,
                focusFactor,
                trend
            };
        }));
    };

    const parseCSV = (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    };

    const handleProcessFiles = async () => {
        if (!tempoFile || !jiraFile) return;

        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            const tempoData = await parseCSV(tempoFile);
            const jiraData = await parseCSV(jiraFile);

            console.log('Tempo Data Sample:', tempoData[0]);
            console.log('Jira Data Sample:', jiraData[0]);

            // Tempo Processing: unique dates with hours > 0
            // Headers for Tempo: User / Worker / Full Name, Work Date / Date, Hours / Logged Hours
            const tempoStats = {};
            tempoData.forEach(row => {
                const name = row['Full Name'] || row['Full name'] || row['Worker'] || row['User'];
                const date = row['Work Date'] || row['Date'] || row['Date Started'];
                const hours = parseFloat(row['Hours'] || row['Hours Logged'] || row['Time Spent (h)'] || 0);

                if (name && date && hours > 0) {
                    const normName = name.trim().toLowerCase();
                    if (!tempoStats[normName]) tempoStats[normName] = new Set();
                    tempoStats[normName].add(date);
                }
            });

            // Jira Processing: sum SP by Assignee
            // Headers for Jira: Assignee, Custom field (Story Points)
            const jiraStats = {};
            jiraData.forEach(row => {
                const assignee = row['Assignee'];
                const sp = parseFloat(row['Custom field (Story Points)'] || 0);

                if (assignee && sp > 0) {
                    const normAssignee = assignee.trim().toLowerCase();
                    if (!jiraStats[normAssignee]) jiraStats[normAssignee] = 0;
                    jiraStats[normAssignee] += sp;
                }
            });

            // Merge and Update Employees
            const allUsers = new Set([
                ...Object.keys(tempoStats),
                ...Object.keys(jiraStats)
            ]);

            const updatedEmployees = [];
            let nextId = Math.max(...employees.map(e => e.id), 0) + 1;

            allUsers.forEach(normName => {
                const workingDays = tempoStats[normName]?.size || 0;
                const storyPoints = jiraStats[normName] || 0;
                const focusFactor = workingDays > 0 ? storyPoints / workingDays : 0.8;

                // Find existing employee or create new
                const existing = employees.find(e => 
                    e.name.trim().toLowerCase() === normName || 
                    (e.jiraUsername && e.jiraUsername.toLowerCase() === normName)
                );

                if (existing) {
                    updatedEmployees.push({
                        ...existing,
                        focusFactor: focusFactor,
                        // We set a single "Virtual Sprint" for historical data from files
                        historicalData: [{
                            sprintName: 'Imported History',
                            actualSP: storyPoints,
                            availableDays: workingDays,
                            excludeFromCalculation: false
                        }]
                    });
                } else {
                    // Create new employee if not found
                    updatedEmployees.push({
                        id: nextId++,
                        name: normName.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                        role: 'developer',
                        focusFactor: focusFactor,
                        participatesInDevelopment: true,
                        jiraUsername: normName,
                        historicalData: [{
                            sprintName: 'Imported History',
                            actualSP: storyPoints,
                            availableDays: workingDays,
                            excludeFromCalculation: false
                        }]
                    });
                }
            });

            // If we have existing employees not in the files, keep them? 
            // The user said: "Автоматически должны быть вписаны все сторудники (с возможностью удаления)"
            // So replacement seems best, or merge. Let's merge but prioritize file data.
            setEmployees(updatedEmployees);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            console.error('Processing error:', err);
            setError(translations.errorParsing);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="focus-calculator-wrapper">
            <div className="card focus-calculator">
                <div className="calculator-header">
                    <div>
                        <h2>⚡️ {translations.focusCalculatorTitle}</h2>
                        {focusFactorSource === 'manual' ? (
                            <p className="calculator-description">
                                {translations.calcDescription}
                            </p>
                        ) : (
                            <p className="calculator-description">
                                {translations.filesSource} - {translations.uploadTempo} & {translations.uploadJira}
                            </p>
                        )}
                        <p className="calculator-note">
                            💡 {translations.focusFactorMethod} = SP / {translations.workingDays}
                        </p>
                    </div>
                </div>

                {focusFactorSource === 'files' ? (
                    <div className="file-upload-container fade-in">
                        <div className="upload-grid">
                            <div className={`upload-zone ${tempoFile ? 'has-file' : ''}`}>
                                <label className="file-label">
                                    <span className="upload-icon">⏱️</span>
                                    <span className="upload-text">{tempoFile ? tempoFile.name : translations.uploadTempo}</span>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={(e) => setTempoFile(e.target.files[0])} 
                                        hidden 
                                    />
                                </label>
                            </div>
                            <div className={`upload-zone ${jiraFile ? 'has-file' : ''}`}>
                                <label className="file-label">
                                    <span className="upload-icon">🎫</span>
                                    <span className="upload-text">{jiraFile ? jiraFile.name : translations.uploadJira}</span>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={(e) => setJiraFile(e.target.files[0])} 
                                        hidden 
                                    />
                                </label>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{translations.successParsing}</div>}

                        <button 
                            className={`process-btn ${(!tempoFile || !jiraFile || isProcessing) ? 'disabled' : ''}`}
                            onClick={handleProcessFiles}
                            disabled={!tempoFile || !jiraFile || isProcessing}
                        >
                            {isProcessing ? (
                                <span className="loader-small"></span>
                            ) : (
                                translations.processFiles
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="employee-calculators">
                        {employees.map(emp => {
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
                                                    <th>{translations.sprint}</th>
                                                    <th>{translations.actual} SP</th>
                                                    <th>{translations.workingDays}</th>
                                                    <th>SP/Day</th>
                                                    <th>—</th>
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
                                                    <td className="total-label">{translations.total}</td>
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
                )}
            </div>
        </div>
    );
}

export default FocusFactorCalculator;

