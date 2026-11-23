import {useContext} from 'react';

import {ToastContext} from '../context/ToastContext';

import type {ToastContextValue} from '../toast';

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error(
            'useToast must be used within a ToastProvider',
        );
    }

    return context;
};