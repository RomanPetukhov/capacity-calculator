import { useState, useEffect } from 'react';
import './ConfigPanel.css';
import { translations as allTranslations } from '../translations';

function ConfigPanel({ 
    config, 
    setConfig, 
    calculationMethod, 
    setCalculationMethod, 
    teamVelocity, 
    setTeamVelocity,
    focusFactorSource,
    setFocusFactorSource
}) {
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const language = 'ru'; 
    const translations = allTranslations[language];
    const VIDEO_PATH = "instruction.mov";

    // Debug log to catch any prop mismatch
    useEffect(() => {
        console.log('--- ConfigPanel Update ---');
        console.log('Method:', calculationMethod);
        console.log('Source:', focusFactorSource);
        console.log('Translations available:', !!translations);
    }, [calculationMethod, focusFactorSource, translations]);

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

    // Use a robust check for the method
    const isFocusMethod = calculationMethod?.toLowerCase().includes('focus') || calculationMethod === 'focusFactor';

    return (
        <div className="card config-panel">
            <h2>{translations.configTitle}</h2>

            <div className="config-section">
                <h3>{translations.calcMethod}</h3>
                <div className="mode-toggle-group refined">
                    <button
                        className={`mode-btn ${isFocusMethod ? 'active' : ''}`}
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
                    </button>
                </div>

                {/* Sub-menu for Focus Factor source selector */}
                {isFocusMethod && (
                    <div className="sub-config-section fade-in" style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '15px' }}>
                        <label className="sub-label">{translations.focusFactorSource || "📥 Источник данных"}</label>
                        <div className="source-toggle-group">
                            <button
                                className={`source-btn ${focusFactorSource === 'manual' ? 'active' : ''}`}
                                onClick={() => setFocusFactorSource('manual')}
                            >
                                {translations.manualSource || "Manual"}
                            </button>
                            <button
                                className={`source-btn ${focusFactorSource === 'files' ? 'active' : ''}`}
                                onClick={() => setFocusFactorSource('files')}
                            >
                                {translations.filesSource || "From Files"}
                            </button>
                        </div>
                    </div>
                )}

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
            </div>

            <FullscreenModal 
                media={fullscreenMedia} 
                onClose={() => setFullscreenMedia(null)} 
                translations={translations} 
            />
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
                        muted
                        playsInline
                        controls 
                        className="fullscreen-video-player"
                    />
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;
