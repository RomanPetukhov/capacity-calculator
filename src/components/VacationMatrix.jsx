import './VacationMatrix.css';

function VacationMatrix({ employees, sprints, vacations, setVacations }) {
    const getVacationKey = (employeeId, sprintId) => `${employeeId}_${sprintId}`;

    const getVacationDays = (employeeId, sprintId) => {
        return vacations[getVacationKey(employeeId, sprintId)] || 0;
    };

    const setVacationDays = (employeeId, sprintId, days) => {
        const key = getVacationKey(employeeId, sprintId);
        setVacations({ ...vacations, [key]: parseInt(days) || 0 });
    };

    const getTotalVacationForEmployee = (employeeId) => {
        return sprints.reduce((sum, sprint) => sum + getVacationDays(employeeId, sprint.id), 0);
    };

    const getTotalVacationForSprint = (sprintId) => {
        return employees.reduce((sum, emp) => sum + getVacationDays(emp.id, sprintId), 0);
    };

    return (
        <div className="card vacation-matrix">
            <h2>🏖️ Vacation & Availability</h2>
            <p className="matrix-description">Enter vacation days for each team member per sprint</p>

            <div className="matrix-container">
                <div className="matrix-scroll">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th className="sticky-col">Team Member</th>
                                {sprints.map(sprint => (
                                    <th key={sprint.id}>{sprint.name}</th>
                                ))}
                                <th className="total-col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="sticky-col employee-name">{emp.name}</td>
                                    {sprints.map(sprint => (
                                        <td key={sprint.id}>
                                            <input
                                                type="number"
                                                value={getVacationDays(emp.id, sprint.id)}
                                                onChange={(e) => setVacationDays(emp.id, sprint.id, e.target.value)}
                                                min="0"
                                                max={sprint.totalWorkingDays}
                                                className="vacation-input"
                                            />
                                        </td>
                                    ))}
                                    <td className="total-col">
                                        <span className="total-value">{getTotalVacationForEmployee(emp.id)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="sticky-col">Total</td>
                                {sprints.map(sprint => (
                                    <td key={sprint.id}>
                                        <span className="total-value">{getTotalVacationForSprint(sprint.id)}</span>
                                    </td>
                                ))}
                                <td className="total-col">
                                    <span className="total-value grand-total">
                                        {employees.reduce((sum, emp) => sum + getTotalVacationForEmployee(emp.id), 0)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default VacationMatrix;
