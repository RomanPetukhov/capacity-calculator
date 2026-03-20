import './ConfigPanel.css';
import { translations as allTranslations } from '../translations';

function ConfigPanel({ config, setConfig, calculationMethod, setCalculationMethod, teamVelocity, setTeamVelocity }) {
    const language = 'ru'; // Determine language if possible, defaulting to ru as per user preference
    const translations = allTranslations[language];
    const handleConfigChange = (key, value) => {
        setConfig({ ...config, [key]: parseFloat(value) || 0 });
    };

    const totalPct = config.bugPct + config.committedPct + (config.enablersPct || 0) + config.techDebtPct;
    const isValidTotal = Math.abs(totalPct - 100) < 0.01;

    return (
        <div className="card config-panel">
            <h2>{translations.configTitle}</h2>

            <div className="config-section">
                <h3>{translations.calcMethod}</h3>
                <div className="mode-toggle-group refined">
                    <button
                        className={`mode-btn ${calculationMethod === 'focusFactor' ? 'active' : ''}`}
                        onClick={() => setCalculationMethod('focusFactor')}
                    >
                        <span className="mode-icon">🎯</span>
                        <span className="mode-label">{translations.focusFactorMethod}</span>
                    </button>

                    <button
                        className={`mode-btn ${calculationMethod === 'velocity' ? 'active' : ''}`}
                        onClick={() => setCalculationMethod('velocity')}
                    >
                        <div className="mode-btn-content">
                            <span className="mode-icon">🚀</span>
                            <span className="mode-label">{translations.avgVelocityMethod}</span>
                        </div>
                        <div className="tooltip-container">
                            <span className="tooltip-icon">ℹ️</span>
                            <div className="tooltip-text">
                                {translations.avgVelocityTooltip}
                            </div>
                        </div>
                    </button>
                </div>

                {calculationMethod === 'velocity' && (
                    <div className="velocity-input-container">
                        <label className="velocity-label">
                            {translations.teamVelocityLabel}
                            <div className="tooltip-container" style={{ marginLeft: '8px', display: 'inline-flex' }}>
                                <span className="tooltip-icon">ℹ️</span>
                                <div className="tooltip-text">
                                    {translations.teamVelocityTooltip}
                                </div>
                            </div>
                        </label>
                        <input
                            type="number"
                            value={teamVelocity === 0 ? '' : teamVelocity}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTeamVelocity(val === '' ? 0 : parseFloat(val));
                            }}
                            className="team-velocity-input"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                )}
            </div>

            <div className="config-section">
                <h3>{translations.allocationPct}</h3>
                <div className="config-grid">
                    <div className="config-item">
                        <label>{translations.maintenance}</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={config.bugPct}
                                onChange={(e) => handleConfigChange('bugPct', e.target.value)}
                                min="0"
                                max="100"
                                step="1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="config-item">
                        <label>{translations.committed}</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={config.committedPct}
                                onChange={(e) => handleConfigChange('committedPct', e.target.value)}
                                min="0"
                                max="100"
                                step="1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="config-item">
                        <label>{translations.spikes}</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={config.enablersPct}
                                onChange={(e) => handleConfigChange('enablersPct', e.target.value)}
                                min="0"
                                max="100"
                                step="1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="config-item">
                        <label>🔧 Tech Debt</label>
                        <div className="input-group">
                            <input
                                type="number"
                                value={config.techDebtPct}
                                onChange={(e) => handleConfigChange('techDebtPct', e.target.value)}
                                min="0"
                                max="100"
                                step="1"
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>
                </div>

                <div className={`total-indicator ${isValidTotal ? 'valid' : 'invalid'}`}>
                    <span>Total: {totalPct.toFixed(1)}%</span>
                    {!isValidTotal && <span className="warning">⚠️ Should equal 100%</span>}
                </div>
            </div>


        </div>
    );
}

export default ConfigPanel;
