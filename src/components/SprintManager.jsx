import { useState, useEffect } from 'react';
import { calculateWorkingDays } from '../utils/russianCalendar';
import './SprintManager.css';

function SprintManager({ sprints, setSprints }) {
    const [newSprintName, setNewSprintName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [manualDays, setManualDays] = useState('');
    const [calculatedDays, setCalculatedDays] = useState(0);

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Helper to add days to a date
    const addDays = (dateStr, days) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return date;
    };

    // Auto-calculate End Date when Start Date changes
    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);

        if (newStart) {
            // Sprint is 2 weeks (14 days). If starting Thu, ends Wed (13 days after start).
            // Example: Thu 11th -> Wed 24th is 14 days total span (inclusive).
            // 11 + 13 = 24.
            const newEnd = formatDate(addDays(newStart, 13));
            setEndDate(newEnd);
        }
    };

    // Auto-calculate working days when dates change
    useEffect(() => {
        if (startDate && endDate) {
            const days = calculateWorkingDays(startDate, endDate);
            setCalculatedDays(days);
        } else {
            setCalculatedDays(0);
        }
    }, [startDate, endDate]);

    const addSprint = () => {
        if (!newSprintName || !startDate || !endDate) return;

        const newSprint = {
            id: Date.now(),
            name: newSprintName,
            startDate,
            endDate,
            calculatedDays,
            manualDays: manualDays ? parseInt(manualDays) : null,
            totalWorkingDays: manualDays ? parseInt(manualDays) : calculatedDays
        };

        setSprints([...sprints, newSprint]);

        // Auto-setup next sprint
        // Next sprint starts day after current ends
        const nextStart = formatDate(addDays(endDate, 1));
        const nextEnd = formatDate(addDays(nextStart, 13));

        setStartDate(nextStart);
        setEndDate(nextEnd);

        // Predict next sprint name (e.g., "Sprint 1" -> "Sprint 2")
        const nameMatch = newSprintName.match(/(\d+)$/);
        if (nameMatch) {
            const nextNum = parseInt(nameMatch[1]) + 1;
            setNewSprintName(newSprintName.replace(/\d+$/, nextNum));
        } else {
            setNewSprintName('');
        }

        setManualDays('');
    };

    const removeSprint = (id) => {
        setSprints(sprints.filter(s => s.id !== id));
    };

    const updateSprint = (id, field, value) => {
        setSprints(sprints.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };

                // Recalculate if dates change
                if (field === 'startDate' || field === 'endDate') {
                    let start = field === 'startDate' ? value : s.startDate;
                    let end = field === 'endDate' ? value : s.endDate;

                    // Auto-update End Date if Start Date changes
                    if (field === 'startDate' && value) {
                        // Calculate end date: Start + 13 days
                        const dateObj = new Date(value);
                        dateObj.setDate(dateObj.getDate() + 13);
                        end = dateObj.toISOString().split('T')[0];

                        // We need to update the 'endDate' field in the object as well
                        updated.endDate = end;
                    }

                    if (start && end) {
                        updated.calculatedDays = calculateWorkingDays(start, end);
                        // Update total only if no manual override or if manual override is cleared (handled separately)
                        if (!updated.manualDays) {
                            updated.totalWorkingDays = updated.calculatedDays;
                        }
                    }
                }

                // Handle manual override change
                if (field === 'manualDays') {
                    const manual = value === '' ? null : parseInt(value);
                    updated.manualDays = manual;
                    updated.totalWorkingDays = manual !== null ? manual : updated.calculatedDays;
                }

                return updated;
            }
            return s;
        }));
    };

    const totalDays = sprints.reduce((sum, s) => sum + s.totalWorkingDays, 0);

    return (
        <div className="card sprint-manager">
            <div className="section-header">
                <h2 className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="calendar-icon">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    📅 Sprint Schedule
                </h2>
                <div className="total-days-badge">
                    Total: {totalDays} days
                </div>
            </div>

            <div className="add-sprint-form">
                <input
                    type="text"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    placeholder="Sprint Name"
                    className="sprint-input name-input"
                />
                <div className="date-group">
                    <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className="sprint-input date-input"
                        title="Start Date"
                    />
                    <span className="date-separator">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="sprint-input date-input"
                        title="End Date"
                    />
                </div>
                <div className="days-preview">
                    {calculatedDays > 0 && (
                        <span className="calc-days" title="Auto-calculated based on RU calendar">
                            🤖 {calculatedDays} days
                        </span>
                    )}
                    <input
                        type="number"
                        value={manualDays}
                        onChange={(e) => setManualDays(e.target.value)}
                        placeholder="Override"
                        className="sprint-input override-input"
                        title="Manual override (optional)"
                    />
                </div>
                <button className="btn-primary" onClick={addSprint}>+ Add Sprint</button>
            </div>

            <div className="sprint-list">
                {sprints.map(sprint => (
                    <div key={sprint.id} className="sprint-item">
                        <div className="sprint-info">
                            <input
                                type="text"
                                value={sprint.name}
                                onChange={(e) => updateSprint(sprint.id, 'name', e.target.value)}
                                className="sprint-name-edit"
                            />
                            <div className="sprint-dates">
                                <input
                                    type="date"
                                    value={sprint.startDate || ''}
                                    onChange={(e) => updateSprint(sprint.id, 'startDate', e.target.value)}
                                    className="date-edit"
                                />
                                <span>→</span>
                                <input
                                    type="date"
                                    value={sprint.endDate || ''}
                                    onChange={(e) => updateSprint(sprint.id, 'endDate', e.target.value)}
                                    className="date-edit"
                                />
                            </div>
                        </div>

                        <div className="sprint-days-control">
                            <div className="days-display">
                                <span className="auto-days" title="Calculated working days">
                                    {sprint.calculatedDays} auto
                                </span>
                                {sprint.manualDays && (
                                    <span className="manual-badge">Manual</span>
                                )}
                            </div>
                            <input
                                type="number"
                                value={sprint.manualDays !== null ? sprint.manualDays : ''}
                                onChange={(e) => updateSprint(sprint.id, 'manualDays', e.target.value)}
                                placeholder="Override"
                                className="days-override-edit"
                                title="Override calculated days"
                            />
                        </div>

                        <button
                            className="btn-icon delete-btn"
                            onClick={() => removeSprint(sprint.id)}
                            title="Remove sprint"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SprintManager;
