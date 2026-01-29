import * as XLSX from 'xlsx';

/**
 * Export capacity calculator data to Excel with formulas
 * Creates a complete duplicate of the calculator with all formulas
 */
export function exportToExcel(employees, sprints, config, vacations, calculationMethod, teamVelocity) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Team Configuration
    createTeamSheet(workbook, employees, calculationMethod);

    // Sheet 2: Sprint Schedule
    createSprintSheet(workbook, sprints);

    // Sheet 3: Vacation Matrix
    createVacationSheet(workbook, employees, sprints, vacations);

    // Sheet 4: Configuration
    createConfigSheet(workbook, config, calculationMethod, teamVelocity);

    // Sheet 5: Capacity Dashboard (Gross)
    createGrossCapacitySheet(workbook, employees, sprints, vacations, calculationMethod, teamVelocity);

    // Sheet 6: Capacity Dashboard (Net)
    createNetCapacitySheet(workbook, employees, sprints, config, vacations, calculationMethod, teamVelocity);

    // Generate and download
    const fileName = `capacity-calculator-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

function createTeamSheet(workbook, employees, calculationMethod) {
    const data = [
        ['Team Members'],
        [],
        ['ID', 'Name', 'Role', 'Participates in Dev', 'Avg SP/Day', 'Trend']
    ];

    employees.forEach(emp => {
        data.push([
            emp.id,
            emp.name,
            emp.role || 'developer',
            emp.participatesInDevelopment !== false ? 'Yes' : 'No',
            emp.focusFactor,
            emp.trend || '→'
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 8 }
    ];

    XLSX.utils.book_append_sheet(workbook, ws, 'Team');
}

function createSprintSheet(workbook, sprints) {
    const data = [
        ['Sprint Schedule'],
        [],
        ['Sprint Name', 'Start Date', 'End Date', 'Working Days']
    ];

    sprints.forEach(sprint => {
        data.push([
            sprint.name,
            sprint.startDate,
            sprint.endDate,
            sprint.totalWorkingDays
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, ws, 'Sprints');
}

function createVacationSheet(workbook, employees, sprints, vacations) {
    const getVacationDays = (employeeId, sprintId) => {
        const key = `${employeeId}_${sprintId}`;
        return vacations[key] || 0;
    };

    const data = [
        ['Vacation & Availability'],
        [],
        ['Team Member', ...sprints.map(s => s.name), 'Total']
    ];

    employees.forEach((emp, empIdx) => {
        const row = [emp.name];
        let totalVacation = 0;

        sprints.forEach((sprint, sprintIdx) => {
            const vacDays = getVacationDays(emp.id, sprint.id);
            totalVacation += vacDays;

            // Add cell reference for vacation days
            row.push(vacDays);
        });

        // Add formula for total
        const startCol = 'B';
        const endCol = String.fromCharCode(66 + sprints.length - 1); // B + sprint count
        const rowNum = empIdx + 4;
        row.push({ f: `SUM(${startCol}${rowNum}:${endCol}${rowNum})` });

        data.push(row);
    });

    // Add totals row
    const totalsRow = ['Total'];
    sprints.forEach((sprint, idx) => {
        const col = String.fromCharCode(66 + idx);
        const startRow = 4;
        const endRow = 3 + employees.length;
        totalsRow.push({ f: `SUM(${col}${startRow}:${col}${endRow})` });
    });

    // Grand total
    const startCol = 'B';
    const endCol = String.fromCharCode(66 + sprints.length - 1);
    const totalsRowNum = 4 + employees.length;
    totalsRow.push({ f: `SUM(${startCol}${totalsRowNum}:${endCol}${totalsRowNum})` });

    data.push(totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, ...sprints.map(() => ({ wch: 12 })), { wch: 10 }];

    XLSX.utils.book_append_sheet(workbook, ws, 'Vacations');
}

function createConfigSheet(workbook, config, calculationMethod, teamVelocity) {
    const data = [
        ['Configuration'],
        [],
        ['Setting', 'Value'],
        ['Calculation Method', calculationMethod === 'focusFactor' ? 'Average SP/Day (Individual)' : 'Average Team Velocity'],
        ['Team Velocity (SP/Day)', teamVelocity || 0],
        [],
        ['Allocation Percentages'],
        ['Bugs', config.bugPct, '%'],
        ['Committed Goals', config.committedPct, '%'],
        ['Uncommitted Goals', config.uncommittedPct, '%'],
        ['Uncommitted Enabled', config.uncommittedEnabled ? 'Yes' : 'No'],
        ['Enablers / Refinement', config.enablersPct, '%'],
        ['Tech Debt', config.techDebtPct, '%'],
        [],
        ['Total', { f: 'B8+B9+B10+B12+B13' }, '%'],
        [],
        ['SAFe Settings'],
        ['Historical includes maintenance', config.historicalIncludesMaintenanceWork ? 'Yes' : 'No'],
        ['Rolling average window', config.rollingAverageWindow || 3, 'sprints']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 8 }];

    XLSX.utils.book_append_sheet(workbook, ws, 'Config');
}

function createGrossCapacitySheet(workbook, employees, sprints, vacations, calculationMethod, teamVelocity) {
    const getVacationDays = (employeeId, sprintId) => {
        const key = `${employeeId}_${sprintId}`;
        return vacations[key] || 0;
    };

    const data = [
        ['Gross Capacity - Team Member Breakdown'],
        ['Total capacity with vacation and focus factor applied'],
        [],
        ['Team Member', calculationMethod === 'velocity' ? 'Daily Share' : 'Avg SP/Day', ...sprints.map(s => s.name), 'Total']
    ];

    employees.forEach((emp, empIdx) => {
        const row = [emp.name];

        // K or Daily Share
        if (calculationMethod === 'velocity') {
            const dailyShare = teamVelocity > 0 ? teamVelocity / employees.length : 0;
            row.push(dailyShare.toFixed(2));
        } else {
            row.push(emp.focusFactor);
        }

        // Sprint capacities with formulas
        sprints.forEach((sprint, sprintIdx) => {
            const vacDays = getVacationDays(emp.id, sprint.id);
            const effectiveDays = sprint.totalWorkingDays - vacDays;

            const kCol = 'B';
            const rowNum = empIdx + 5;

            if (calculationMethod === 'velocity') {
                // Capacity = Daily Share * Effective Days
                row.push({ f: `${kCol}${rowNum}*${effectiveDays}` });
            } else {
                // Capacity = K * Effective Days
                row.push({ f: `${kCol}${rowNum}*${effectiveDays}` });
            }
        });

        // Total formula
        const startCol = 'C';
        const endCol = String.fromCharCode(67 + sprints.length - 1);
        const rowNum = empIdx + 5;
        row.push({ f: `SUM(${startCol}${rowNum}:${endCol}${rowNum})` });

        data.push(row);
    });

    // Totals row
    const totalsRow = ['Total', ''];
    sprints.forEach((sprint, idx) => {
        const col = String.fromCharCode(67 + idx);
        const startRow = 5;
        const endRow = 4 + employees.length;
        totalsRow.push({ f: `SUM(${col}${startRow}:${col}${endRow})` });
    });

    // Grand total
    const startCol = 'C';
    const endCol = String.fromCharCode(67 + sprints.length - 1);
    const totalsRowNum = 5 + employees.length;
    totalsRow.push({ f: `SUM(${startCol}${totalsRowNum}:${endCol}${totalsRowNum})` });

    data.push(totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, ...sprints.map(() => ({ wch: 12 })), { wch: 12 }];

    XLSX.utils.book_append_sheet(workbook, ws, 'Gross Capacity');
}

function createNetCapacitySheet(workbook, employees, sprints, config, vacations, calculationMethod, teamVelocity) {
    const getVacationDays = (employeeId, sprintId) => {
        const key = `${employeeId}_${sprintId}`;
        return vacations[key] || 0;
    };

    const data = [
        ['Net Capacity - After Bugs & Tech Debt'],
        [`Capacity after deducting ${config.bugPct}% for bugs and ${config.techDebtPct}% for tech debt`],
        [],
        ['Team Member', calculationMethod === 'velocity' ? 'Daily Share' : 'Avg SP/Day', ...sprints.map(s => s.name), 'Total']
    ];

    // Filter employees who participate in development
    const devEmployees = employees.filter(emp => emp.participatesInDevelopment !== false);

    devEmployees.forEach((emp, empIdx) => {
        const row = [emp.name];

        // K or Daily Share
        if (calculationMethod === 'velocity') {
            const dailyShare = teamVelocity > 0 ? teamVelocity / employees.length : 0;
            row.push(dailyShare.toFixed(2));
        } else {
            row.push(emp.focusFactor);
        }

        // Sprint capacities with formulas (after deductions)
        sprints.forEach((sprint, sprintIdx) => {
            const vacDays = getVacationDays(emp.id, sprint.id);
            const effectiveDays = sprint.totalWorkingDays - vacDays;

            const kCol = 'B';
            const rowNum = empIdx + 5;
            const deductionFactor = 1 - (config.bugPct + config.techDebtPct) / 100;

            if (calculationMethod === 'velocity') {
                row.push({ f: `${kCol}${rowNum}*${effectiveDays}*${deductionFactor}` });
            } else {
                row.push({ f: `${kCol}${rowNum}*${effectiveDays}*${deductionFactor}` });
            }
        });

        // Total formula
        const startCol = 'C';
        const endCol = String.fromCharCode(67 + sprints.length - 1);
        const rowNum = empIdx + 5;
        row.push({ f: `SUM(${startCol}${rowNum}:${endCol}${rowNum})` });

        data.push(row);
    });

    // Totals row
    const totalsRow = ['Total Net Capacity', ''];
    sprints.forEach((sprint, idx) => {
        const col = String.fromCharCode(67 + idx);
        const startRow = 5;
        const endRow = 4 + devEmployees.length;
        totalsRow.push({ f: `SUM(${col}${startRow}:${col}${endRow})` });
    });

    // Grand total
    const startCol = 'C';
    const endCol = String.fromCharCode(67 + sprints.length - 1);
    const totalsRowNum = 5 + devEmployees.length;
    totalsRow.push({ f: `SUM(${startCol}${totalsRowNum}:${endCol}${totalsRowNum})` });

    data.push(totalsRow);

    // Add allocation breakdown
    data.push([]);
    data.push(['Sprint Allocation Breakdown']);
    data.push([]);

    const categories = [
        ['🐛 Bugs', config.bugPct],
        ['✅ Committed', config.committedPct],
        ['📋 Uncommitted', config.uncommittedEnabled ? config.uncommittedPct : 0],
        ['🔮 Enablers', config.enablersPct],
        ['🔧 Tech Debt', config.techDebtPct]
    ];

    data.push(['Category', ...sprints.map(s => s.name), 'Total']);

    categories.forEach(([category, pct]) => {
        const row = [category];
        const totalRowNum = 5 + devEmployees.length;

        sprints.forEach((sprint, idx) => {
            const col = String.fromCharCode(67 + idx);
            row.push({ f: `${col}${totalRowNum}*${pct}/100` });
        });

        // Total for category
        const startCol = 'B';
        const endCol = String.fromCharCode(66 + sprints.length);
        const catRowNum = data.length + 1;
        row.push({ f: `SUM(${startCol}${catRowNum}:${endCol}${catRowNum})` });

        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, ...sprints.map(() => ({ wch: 12 })), { wch: 12 }];

    XLSX.utils.book_append_sheet(workbook, ws, 'Net Capacity');
}

export default exportToExcel;
