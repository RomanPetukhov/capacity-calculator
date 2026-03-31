import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { translations as allTranslations } from '../translations';
import './FocusFactorCalculator.css';

const InfoIcon = () => (
    <svg className="rich-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

function FocusFactorCalculator({ employees, setEmployees, config, focusFactorSource }) {
    const language = 'ru';
    const translations = allTranslations[language];
    
    const [tempoFile, setTempoFile] = useState(null);
    const [jiraFile, setJiraFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isQuartersVisible, setIsQuartersVisible] = useState(false);

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

            // Normalization helper: remove dots, spaces, underscores and to lowercase
            const normalize = (str) => (str || '').toString().toLowerCase().replace(/[\s._-]/g, '');

            // Helper to get value from row case-insensitively
            const getVal = (row, possibleKeys) => {
                const rowKeys = Object.keys(row);
                for (const pKey of possibleKeys) {
                    const pKeyLower = pKey.toLowerCase();
                    const foundKey = rowKeys.find(k => k.trim().toLowerCase() === pKeyLower);
                    if (foundKey) return row[foundKey];
                }
                return undefined;
            };

            // Tempo Processing: unique dates with hours > 0
            const tempoStats = {}; 
            tempoData.forEach(row => {
                const username = getVal(row, ['username', 'user', 'worker']);
                const fullName = getVal(row, ['full name', 'fullname', 'name']);
                const date = getVal(row, ['work date', 'date', 'date started']);
                const hoursVal = getVal(row, ['hours', 'hours logged', 'time spent (h)']);
                const hours = parseFloat(hoursVal || 0);

                const identifier = username || fullName;

                if (identifier && date && hours > 0) {
                    const normId = normalize(identifier);
                    if (!tempoStats[normId]) {
                        tempoStats[normId] = {
                            dates: new Set(),
                            displayName: fullName || username
                        };
                    }
                    tempoStats[normId].dates.add(date.split(' ')[0]); // Extract date part if it has time
                }
            });

            // Jira Processing: sum SP by Assignee
            const jiraStats = {};
            jiraData.forEach(row => {
                const assignee = getVal(row, ['assignee']);
                const sp = parseFloat(getVal(row, ['custom field (story points)', 'story points']) || 0);

                if (assignee && sp > 0) {
                    const normAssignee = normalize(assignee);
                    if (!jiraStats[normAssignee]) jiraStats[normAssignee] = 0;
                    jiraStats[normAssignee] += sp;
                }
            });

            // Merge and Update Employees
            const allUsers = new Set([
                ...Object.keys(tempoStats),
                ...Object.keys(jiraStats)
            ]);

            let nextId = Date.now();
            
            // Map to track which employees from the existing list were updated
            const updatedExistingIds = new Set();
            
            const updatedEmployees = employees.map(emp => {
                const normEmpName = normalize(emp.name);
                const normJiraName = emp.jiraUsername ? normalize(emp.jiraUsername) : null;
                
                // Try to find matching data in our parsed stats
                const matchId = [...allUsers].find(id => id === normEmpName || id === normJiraName);
                
                if (matchId) {
                    updatedExistingIds.add(emp.id);
                    const workingDays = tempoStats[matchId]?.dates.size || 0;
                    const storyPoints = jiraStats[matchId] || 0;
                    const calculatedFF = workingDays > 0 ? storyPoints / workingDays : emp.focusFactor;

                    return {
                        ...emp,
                        focusFactor: calculatedFF,
                        historicalData: [{
                            sprintName: 'Imported (Files)',
                            actualSP: storyPoints,
                            availableDays: workingDays,
                            excludeFromCalculation: false
                        }]
                    };
                }
                return emp;
            });

            // Add new employees found in files but not in the app
            allUsers.forEach(matchId => {
                // Check if this match was already used to update an existing employee
                const alreadyAdded = employees.some(e => 
                    normalize(e.name) === matchId || (e.jiraUsername && normalize(e.jiraUsername) === matchId)
                );

                if (!alreadyAdded) {
                    const workingDays = tempoStats[matchId]?.dates.size || 0;
                    const storyPoints = jiraStats[matchId] || 0;
                    const calculatedFF = workingDays > 0 ? storyPoints / workingDays : 0.8;
                    const displayName = tempoStats[matchId]?.displayName || matchId;

                    updatedEmployees.push({
                        id: nextId++,
                        name: displayName.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                        role: 'developer',
                        focusFactor: calculatedFF,
                        participatesInDevelopment: true,
                        jiraUsername: matchId,
                        historicalData: [{
                            sprintName: 'Imported (Files)',
                            actualSP: storyPoints,
                            availableDays: workingDays,
                            excludeFromCalculation: false
                        }]
                    });
                }
            });

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

                <div className="quarter-dates-section">
                    <button 
                        className="quarter-dates-toggle" 
                        onClick={() => setIsQuartersVisible(!isQuartersVisible)}
                        style={{ marginBottom: isQuartersVisible ? '1rem' : '0' }}
                    >
                        {isQuartersVisible ? '▼ Скрыть даты кварталов' : '▶ Посмотреть даты кварталов'}
                    </button>
                    {isQuartersVisible && (
                        <div className="quarter-dates-table-container fade-in">
                            <table className="quarter-dates-table">
                                <thead>
                                    <tr>
                                        <th>Название</th>
                                        <th>Даты планирования</th>
                                        <th>Даты квартала</th>
                                        <th>Расписание спринтов, количество рабочих дней (р.д.)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>2025 Q3</td>
                                        <td>4 - 8 августа 2025</td>
                                        <td>7 августа - 29 октября</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 7.08-20.08<br/>
                                            Спринт 2: 21.08-03.09<br/>
                                            Спринт 3: 04.09-17.09<br/>
                                            Спринт 4: 18.09-01.10<br/>
                                            Спринт 5: 02.10-15.10<br/>
                                            Спринт 6: 16.10-29.10<br/>
                                            Планирование: 27-30.10
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2025 Q4</td>
                                        <td>27 - 30 октября</td>
                                        <td>30 октября - 21 января</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 30.10-12.11 (08 р.д.)<br/>
                                            Спринт 2: 13.11-26.11 (10 р.д.)<br/>
                                            Спринт 3: 27.11-10.12 (10 р.д.)<br/>
                                            Спринт 4: 11.12-24.12 (10 р.д.)<br/>
                                            Спринт 5: 25.12-14.01 (07 р.д.)<br/>
                                            Спринт 6: 15.01-21.01 (02 р.д. + 3 р.д. планирования)<br/>
                                            Планирование: 19-22.01
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2026 Q1</td>
                                        <td>19 - 23 января</td>
                                        <td>22 января - 15 апреля</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 22.01-04.02 (09 р.д. + 1 р.д. планирования)<br/>
                                            Спринт 2: 05.02-18.02 (10 р.д.)<br/>
                                            Спринт 3: 19.02-04.03 (09 р.д.)<br/>
                                            Спринт 4: 05.03-18.03 (09 р.д.)<br/>
                                            Спринт 5: 19.03-01.04 (10 р.д.)<br/>
                                            Спринт 6: 02.04-15.04 (7 р.д. + 3 р.д. планирования)<br/>
                                            Планирование: 13-16.04
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2026 Q2</td>
                                        <td>13 - 17 апреля</td>
                                        <td>22 апреля - 8 июля</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 16.04-29.04 (09 р.д. + 1 р.д. планирования)<br/>
                                            Спринт 2: 30.04-13.05 (08 р.д.)<br/>
                                            Спринт 3: 14.05-27.05 (10 р.д.)<br/>
                                            Спринт 4: 28.05-10.06 (10 р.д.)<br/>
                                            Спринт 5: 11.06-24.06 (09 р.д.)<br/>
                                            Спринт 6: 25.06-08.07 (10 р.д.)<br/>
                                            Планирование: 06-09.07
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2026 Q3</td>
                                        <td>06 - 10 июля</td>
                                        <td>9 июля - 30 сентября</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 09.07-22.07 (10 р.д.)<br/>
                                            Спринт 2: 23.07-05.08 (10 р.д.)<br/>
                                            Спринт 3: 06.08-19.08 (10 р.д.)<br/>
                                            Спринт 4: 20.08-02.09 (10 р.д.)<br/>
                                            Спринт 5: 03.09-16.09 (10 р.д.)<br/>
                                            Спринт 6: 17.09-30.09 (7 р.д. + 3 р.д. планирования)<br/>
                                            Планирование: 28.09-01.10
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>2026 Q4</td>
                                        <td>28 сентября - 02 октября</td>
                                        <td>1 октября - 23 декабря</td>
                                        <td className="sprint-schedule-cell">
                                            Спринт 1: 01.10-14.10 (10 р.д.)<br/>
                                            Спринт 2: 15.10-28.10 (10 р.д.)<br/>
                                            Спринт 3: 29.10-11.11 (09 р.д.)<br/>
                                            Спринт 4: 12.11-25.11 (10 р.д.)<br/>
                                            Спринт 5: 26.11-09.12 (10 р.д.)<br/>
                                            Спринт 6: 10.12-23.12 (07 р.д. + 3 р.д. планирования)<br/>
                                            Планирование: 21.12-24.12
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {focusFactorSource === 'files' ? (
                    <div className="file-upload-container fade-in">
                        <div className="upload-grid">
                            <div className={`upload-zone ${tempoFile ? 'has-file' : ''}`}>
                                <div className="zone-tooltip-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <div className="rich-tooltip-container">
                                        <InfoIcon />
                                        <div className="rich-tooltip-popover">
                                            <div className="rich-tooltip-content">
                                                <h4>{translations.tempoTooltipTitle}</h4>
                                                <p>{translations.tempoTooltipDesc}</p>
                                                <a href={translations.tempoLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px', textDecoration: 'none' }}>
                                                    🔗 {translations.tempoLinkText}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                <div className="zone-tooltip-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <div className="rich-tooltip-container">
                                        <InfoIcon />
                                        <div className="rich-tooltip-popover">
                                            <div className="rich-tooltip-content">
                                                <h4>{translations.jiraTooltipTitle}</h4>
                                                <p>{translations.jiraTooltipDesc}</p>
                                                <a href={translations.jiraLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px', textDecoration: 'none' }}>
                                                    🔗 {translations.jiraLinkText}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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

