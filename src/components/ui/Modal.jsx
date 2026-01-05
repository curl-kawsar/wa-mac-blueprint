'use client';

import { useEffect } from 'react';
import { Button } from './Button';

/**
 * Modal Component
 * Reusable modal dialog
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true,
    footer,
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-xl transform transition-all`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                            {showClose && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div className="px-6 py-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * ConfirmModal Component
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className="text-gray-600">{message}</p>
        </Modal>
    );
}

export default Modal;
