import './TeamManager.css';
import { translations as allTranslations } from '../translations';

function TeamManager({ employees, setEmployees, calculationMethod }) {
    const language = 'ru';
    const translations = allTranslations[language];
    const addEmployee = () => {
        const newId = Math.max(...employees.map(e => e.id), 0) + 1;
        setEmployees([...employees, {
            id: newId,
            name: `Employee ${newId}`,
            focusFactor: 0.8, // SAFe default
            role: 'developer',
            participatesInDevelopment: true,
            historicalData: [],
            trend: '→'
        }]);
    };

    const removeEmployee = (id) => {
        setEmployees(employees.filter(e => e.id !== id));
    };

    const updateEmployeeName = (id, name) => {
        setEmployees(employees.map(e =>
            e.id === id ? { ...e, name } : e
        ));
    };

    const updateEmployeeRole = (id, role) => {
        setEmployees(employees.map(e =>
            e.id === id ? { ...e, role } : e
        ));
    };

    const updateEmployeeParticipation = (id, participates) => {
        setEmployees(employees.map(e =>
            e.id === id ? { ...e, participatesInDevelopment: participates } : e
        ));
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'scrumMaster': return 'SM';
            case 'productOwner': return 'PO';
            case 'developer': return 'Dev';
            default: return role;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'scrumMaster': return '🎯';
            case 'productOwner': return '📋';
            case 'developer': return '💻';
            default: return '👤';
        }
    };

    return (
        <div className="card team-manager">
            <div className="section-header">
                <h2>{translations.teamMembersTitle}</h2>
                <button className="btn-primary" onClick={addEmployee}>{translations.addMember}</button>
            </div>

            <div className="team-list">
                {employees.map(emp => {
                    const isNonDev = !emp.participatesInDevelopment ||
                        (emp.role && emp.role !== 'developer');

                    return (
                        <div
                            key={emp.id}
                            className={`team-item ${isNonDev ? 'non-dev' : ''}`}
                        >
                            <div className="team-item-main">
                                <div className="team-name-section">
                                    <input
                                        type="text"
                                        value={emp.name}
                                        onChange={(e) => updateEmployeeName(emp.id, e.target.value)}
                                        className="team-name"
                                        placeholder={translations.employeeName}
                                    />
                                    {emp.role && emp.role !== 'developer' && (
                                        <span className={`role-badge ${emp.role}`}>
                                            {getRoleIcon(emp.role)} {getRoleLabel(emp.role)}
                                        </span>
                                    )}
                                </div>

                                <div className="team-controls">
                                    <div className="role-selector">
                                        <label>Role:</label>
                                        <select
                                            value={emp.role || 'developer'}
                                            onChange={(e) => updateEmployeeRole(emp.id, e.target.value)}
                                            className="role-select"
                                        >
                                            <option value="developer">Developer</option>
                                            <option value="scrumMaster">Scrum Master</option>
                                            <option value="productOwner">Product Owner</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="participation-toggle">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={emp.participatesInDevelopment !== false}
                                                onChange={(e) => updateEmployeeParticipation(emp.id, e.target.checked)}
                                            />
                                            <span>Participates in Development</span>
                                        </label>
                                    </div>

                                    {calculationMethod === 'focusFactor' && (
                                        <div className="focus-display">
                                            <span className="focus-label">{translations.avgVelocity}</span>
                                            <span className="focus-value">{emp.focusFactor.toFixed(2)}</span>
                                            {emp.trend && <span className="trend-arrow">{emp.trend}</span>}
                                        </div>
                                    )}

                                    <button
                                        className="btn-icon delete-btn"
                                        onClick={() => removeEmployee(emp.id)}
                                        disabled={employees.length === 1}
                                        title="Remove employee"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {isNonDev && (
                                <div className="non-dev-notice">
                                    ⚠️ This team member will be excluded from Net Capacity calculations
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TeamManager;
