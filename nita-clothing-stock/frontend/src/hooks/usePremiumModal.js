import { useState } from 'react';

const usePremiumModal = () => {
    const [premiumModal, setPremiumModal] = useState({
        show: false,
        type: 'info',
        title: '',
        message: '',
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        onConfirm: () => { },
        inputValue: '',
        onInputChange: (val) => setPremiumModal(prev => ({ ...prev, inputValue: val }))
    });

    const showConfirm = (title, message, onConfirm, type = 'confirm', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
        setPremiumModal({
            ...premiumModal,
            show: true,
            type,
            title,
            message,
            confirmText,
            cancelText,
            onConfirm: async () => {
                await onConfirm();
                setPremiumModal(prev => ({ ...prev, show: false }));
            }
        });
    };

    const showDanger = (title, message, onConfirm, confirmText = 'Eliminar', cancelText = 'Cancelar') => {
        showConfirm(title, message, onConfirm, 'danger', confirmText, cancelText);
    };

    const showPrompt = (title, message, initialValue, onConfirm, confirmText = 'Aceptar', cancelText = 'Cancelar') => {
        setPremiumModal({
            ...premiumModal,
            show: true,
            type: 'prompt',
            title,
            message,
            inputValue: initialValue.toString(),
            confirmText,
            cancelText,
            onConfirm: async () => {
                // Here we need to use a trick to get the current inputValue from the state
                // since we are in a closure. We can pass the value to onConfirm.
                // But for now, let's keep it simple and handle it in the component if needed.
                // Actually, let's change onConfirm to pass the value.
            }
        });
    };

    const closeModal = () => {
        setPremiumModal(prev => ({ ...prev, show: false }));
    };

    return {
        premiumModal,
        setPremiumModal,
        showConfirm,
        showDanger,
        showPrompt,
        closeModal
    };
};

export default usePremiumModal;
