import React, { useState } from 'react';
import './CapacityDashboard.css';

const CapacityDashboard = ({ config, teams, sprints, vacations, translations }) => {
    const [roundingMode, setRoundingMode] = useState('floor'); // floor, nearest, ceil, none

    const formatValue = (val) => {
        if (roundingMode === 'none') return val.toFixed(1);
        if (roundingMode === 'floor') return Math.floor(val);
        if (roundingMode === 'ceil') return Math.ceil(val);
        return Math.round(val);
    };

    const getSprintWorkingDays = (sprintName) => {
        const sprint = sprints.find(s => s.name === sprintName);
        return sprint ? sprint.workingDays : 10;
    };

    const calculateMemberSprintCapacity = (member, sprintName) => {
        const workingDays = getSprintWorkingDays(sprintName);
        const vacationDays = vacations[sprintName]?.[member.id] || 0;
        const availableDays = Math.max(0, workingDays - vacationDays);
        const dailyCapacity = config.calculationMethod === 'focusFactor' 
            ? member.focusFactor 
            : member.avgVelocity / workingDays;
        
        return availableDays * dailyCapacity;
    };

    const calculateSprintAllocation = (sprintName) => {
        const totalGross = teams.reduce((sum, member) => 
            sum + calculateMemberSprintCapacity(member, sprintName), 0);
        
        const sprint = sprints.find(s => s.name === sprintName);
        const factors = sprint?.factors || config;

        return {
            maintenance: (totalGross * factors.maintenancePct) / 100,
            committed: (totalGross * factors.committedPct) / 100,
            spikes: (totalGross * factors.enablersPct) / 100,
            techDebt: (totalGross * factors.techDebtPct) / 100,
            totalGross
        };
    };

    const renderAllocationItem = (label, value, color, total) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="allocation-item">
                <div className="allocation-header">
                    <span className="allocation-label">{label}</span>
                    <span className="allocation-value">{formatValue(value)} SP</span>
                </div>
                <div className="allocation-bar-bg">
                    <div 
                        className="allocation-bar-fill" 
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                    ></div>
                </div>
                <div className="allocation-footer">
                    <span className="allocation-pct">{Math.round(percentage)} %</span>
                </div>
            </div>
        );
    };

    return (
        <div className="card capacity-dashboard">
            <h2>{translations.capacityDashboardTitle}</h2>
            <p className="dashboard-description">{translations.dashboardDesc}</p>

            {/* Employee Breakdown Table - Gross Capacity */}
            <div className="employee-breakdown">
                <p className="table-description">{translations.grossCapacityDesc}</p>
                <div className="table-container">
                    <table className="breakdown-table">
                        <thead>
                            <tr>
                                <th>{translations.teamMember}</th>
                                <th>{translations.dailyShare}</th>
                                {sprints.map(s => <th key={s.id}>{s.name}</th>)}
                                <th>{translations.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map(member => (
                                <tr key={member.id}>
                                    <td className="member-cell">
                                        <span className="member-idx">{member.name.charAt(0)}</span>
                                        {member.name}
                                    </td>
                                    <td>
                                        {config.calculationMethod === 'focusFactor' 
                                            ? member.focusFactor.toFixed(2) 
                                            : (member.avgVelocity / getSprintWorkingDays(sprints[0]?.name)).toFixed(2)}
                                    </td>
                                    {sprints.map(s => (
                                        <td key={s.id}>
                                            {formatValue(calculateMemberSprintCapacity(member, s.name))}
                                        </td>
                                    ))}
                                    <td className="total-cell highlight">
                                        {formatValue(sprints.reduce((sum, s) => 
                                            sum + calculateMemberSprintCapacity(member, s.name), 0))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2">{translations.totalCapacity}</td>
                                {sprints.map(s => (
                                    <td key={s.id}>
                                        {formatValue(teams.reduce((sum, member) => 
                                            sum + calculateMemberSprintCapacity(member, s.name), 0))}
                                    </td>
                                ))}
                                <td className="total-cell highlight-lg">
                                    {formatValue(sprints.reduce((sum, s) => 
                                        sum + teams.reduce((msum, m) => msum + calculateMemberSprintCapacity(m, s.name), 0), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Sprint Allocation Breakdown - NET Capacity for Committed only */}
            <div className="sprint-allocation-grid">
                <h3>{translations.sprintAllocation}</h3>
                <div className="sprints-container">
                    {sprints.map(s => {
                        const allocation = calculateSprintAllocation(s.name);
                        return (
                            <div key={s.id} className="sprint-card-mini">
                                <div className="sprint-header-mini">
                                    <h4>{s.name}</h4>
                                    <span className="gross-total">{formatValue(allocation.committed)} SP</span>
                                </div>
                                <div className="allocation-list">
                                    {renderAllocationItem(translations.maintenance, allocation.maintenance, '#e74c3c', allocation.totalGross)}
                                    {renderAllocationItem(translations.committed, allocation.committed, '#2ecc71', allocation.totalGross)}
                                    {renderAllocationItem(translations.spikes, allocation.spikes, '#9b59b6', allocation.totalGross)}
                                    {renderAllocationItem(translations.techDebt, allocation.techDebt, '#f39c12', allocation.totalGross)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total Summary - Net Committed Capacity Table */}
            <div className="final-summary">
                <div className="summary-header">
                    <div className="summary-title-group">
                        <h3>{translations.netCapacityTitle}</h3>
                        <p className="summary-desc">{translations.netCapacityDesc}</p>
                    </div>
                    
                    <div className="rounding-selector">
                        <span>{translations.rounding}</span>
                        <select 
                            value={roundingMode} 
                            onChange={(e) => setRoundingMode(e.target.value)}
                        >
                            <option value="floor">{translations.roundFloor}</option>
                            <option value="nearest">{translations.roundNearest}</option>
                            <option value="ceil">{translations.roundCeil}</option>
                            <option value="none">{translations.roundNone}</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="breakdown-table summary-table">
                        <thead>
                            <tr>
                                <th>{translations.teamMember}</th>
                                <th>{translations.dailyShare}</th>
                                {sprints.map(s => <th key={s.id}>{s.name}</th>)}
                                <th>{translations.totalNetCapacity}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map(member => (
                                <tr key={member.id}>
                                    <td className="member-cell">
                                        <span className="member-idx">{member.name.charAt(0)}</span>
                                        {member.name}
                                    </td>
                                    <td>
                                        {(calculateMemberSprintCapacity(member, sprints[0]?.name) * 
                                          (sprints[0]?.factors?.committedPct || config.committedPct) / 100 / 
                                          getSprintWorkingDays(sprints[0]?.name)).toFixed(2)}
                                    </td>
                                    {sprints.map(s => {
                                        const gross = calculateMemberSprintCapacity(member, s.name);
                                        const factors = s.factors || config;
                                        const netCommitted = (gross * factors.committedPct) / 100;
                                        return <td key={s.id}>{formatValue(netCommitted)}</td>;
                                    })}
                                    <td className="total-cell highlight">
                                        {formatValue(sprints.reduce((sum, s) => {
                                            const gross = calculateMemberSprintCapacity(member, s.name);
                                            const factors = s.factors || config;
                                            return sum + (gross * factors.committedPct) / 100;
                                        }, 0))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2">{translations.totalNetCapacity}</td>
                                {sprints.map(s => {
                                    const sprintTotalCommitted = teams.reduce((sum, member) => {
                                        const gross = calculateMemberSprintCapacity(member, s.name);
                                        const factors = s.factors || config;
                                        return sum + (gross * factors.committedPct) / 100;
                                    }, 0);
                                    return <td key={s.id}>{formatValue(sprintTotalCommitted)}</td>;
                                })}
                                <td className="total-cell highlight-lg">
                                    {formatValue(sprints.reduce((sum, s) => {
                                        return sum + teams.reduce((msum, member) => {
                                            const gross = calculateMemberSprintCapacity(member, s.name);
                                            const factors = s.factors || config;
                                            return msum + (gross * factors.committedPct) / 100;
                                        }, 0);
                                    }, 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CapacityDashboard;
