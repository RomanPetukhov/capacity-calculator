import { useState } from 'react';
import './ConfigPanel.css';
import { translations as allTranslations } from '../translations';

function ConfigPanel({ config, setConfig, calculationMethod, setCalculationMethod, teamVelocity, setTeamVelocity }) {
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const language = 'ru'; 
    const translations = allTranslations[language];
    const VIDEO_PATH = "/instruction.mov";

    const InfoIcon = () => (
        <svg className="rich-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
    );
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
                        <div className="rich-tooltip-container absolute-top-right">
                            <InfoIcon />
                            <div className="rich-tooltip-popover">
                                <div className="rich-tooltip-content">
                                    <h4>{translations.avgVelocityMethod}</h4>
                                    <p>{translations.avgVelocityTooltip}</p>
                                    <div className="rich-tooltip-media" onClick={(e) => { e.stopPropagation(); setFullscreenMedia(VIDEO_PATH); }}>
                                        <div className="media-zoom-overlay">⛶ Click to Expand</div>
                                        <video src={VIDEO_PATH} autoPlay loop muted playsInline className="tooltip-video-preview" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {calculationMethod === 'velocity' && (
                    <div className="velocity-input-container">
                        <label className="velocity-label">
                            {translations.teamVelocityLabel}
                            <div className="rich-tooltip-container" style={{ marginLeft: '12px' }}>
                                <InfoIcon />
                                <div className="rich-tooltip-popover">
                                    <div className="rich-tooltip-content">
                                        <h4>{translations.tooltipTitle}</h4>
                                        <p>{translations.tooltipDesc}</p>
                                        <div className="rich-tooltip-media" onClick={(e) => { e.stopPropagation(); setFullscreenMedia(VIDEO_PATH); }}>
                                            <div className="media-zoom-overlay">⛶ Click to Expand</div>
                                            <video src={VIDEO_PATH} autoPlay loop muted playsInline className="tooltip-video-preview" />
                                        </div>
                                    </div>
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
            </div>            <FullscreenModal media={fullscreenMedia} onClose={() => setFullscreenMedia(null)} translations={translations} />
        </div>
    );
}

const FullscreenModal = ({ media, onClose, translations }) => {
    if (!media) return null;
    return (
        <div className="tooltip-modal-overlay" onClick={onClose}>
            <div className="tooltip-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>×</button>
                <div className="modal-header-fullscreen">
                    <h3>{translations.tooltipTitle}</h3>
                    <p>{translations.tooltipDesc}</p>
                </div>
                <div className="modal-body-fullscreen">
                    <video 
                        src={media} 
                        autoPlay 
                        loop 
                        controls 
                        className="fullscreen-video-player"
                    />
                </div>
            </div>
        </div>
    );
}

export default ConfigPanel;
