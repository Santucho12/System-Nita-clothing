import React from 'react';
import './PremiumModal.css';
import { FaExclamationTriangle, FaCheckCircle, FaTrash, FaQuestionCircle, FaArrowRight } from 'react-icons/fa';

/**
 * PremiumModal component for high-quality alerts, confirmations and prompts.
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the modal
 * @param {string} props.type - 'info', 'confirm', 'danger', 'prompt'
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} props.inputValue - For prompt: current input value
 * @param {function} props.onInputChange - For prompt: function to handle input change
 * @param {function} props.onConfirm - Function to call on confirmation/ok
 * @param {function} props.onCancel - Function to call on cancel/close
 * @param {string} props.confirmText - Text for the confirm button
 * @param {string} props.cancelText - Text for the cancel button
 */
const PremiumModal = ({
    show,
    type = 'info',
    title,
    message,
    inputValue,
    onInputChange,
    onConfirm,
    onCancel,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
}) => {
    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <FaTrash style={{ color: '#ef4444' }} />;
            case 'confirm': return <FaQuestionCircle style={{ color: '#3b82f6' }} />;
            case 'info': return <FaCheckCircle style={{ color: '#10b981' }} />;
            case 'prompt': return <FaArrowRight style={{ color: '#f73194' }} />;
            default: return <FaExclamationTriangle style={{ color: '#f59e0b' }} />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'danger': return 'var(--danger-gradient, linear-gradient(135deg, #ef4444, #b91c1c))';
            case 'confirm': return 'var(--blue-gradient, linear-gradient(135deg, #3b82f6, #1d4ed8))';
            case 'prompt': return 'var(--pink-gradient, linear-gradient(135deg, #f73194, #ff69b4))';
            default: return 'var(--pink-gradient, linear-gradient(135deg, #f73194, #ff69b4))';
        }
    };

    return (
        <div className="premium-modal-overlay" onClick={onCancel}>
            <div className="premium-modal-content" onClick={e => e.stopPropagation()}>
                <div className="premium-modal-icon-wrapper" style={{ background: 'var(--bg-tertiary)' }}>
                    {getIcon()}
                </div>

                <h2 className="premium-modal-title">{title}</h2>
                <p className="premium-modal-message">{message}</p>

                {type === 'prompt' && (
                    <div className="premium-modal-input-container">
                        <input
                            type="text"
                            className="premium-modal-input"
                            value={inputValue}
                            onChange={e => onInputChange(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') onConfirm();
                                if (e.key === 'Escape') onCancel();
                            }}
                        />
                    </div>
                )}

                <div className="premium-modal-actions">
                    <button className="premium-modal-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`premium-modal-btn confirm ${type === 'danger' ? 'danger' : ''}`}
                        onClick={onConfirm}
                        style={{ background: type === 'danger' ? '#ef4444' : 'var(--accent-pink)' }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
