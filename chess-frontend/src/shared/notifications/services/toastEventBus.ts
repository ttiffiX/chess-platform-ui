import type {ToastEventDetail} from '../toast';

const TOAST_EVENT = 'toast';

const eventTarget = new EventTarget();

export const publishToast = (
    detail: ToastEventDetail,
): void => {
    eventTarget.dispatchEvent(
        new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
            detail,
        }),
    );
};

export const subscribeToToast = (
    listener: (detail: ToastEventDetail) => void,
): (() => void) => {
    const handler = (event: Event) => {
        const customEvent =
            event as CustomEvent<ToastEventDetail>;

        listener(customEvent.detail);
    };

    eventTarget.addEventListener(TOAST_EVENT, handler);

    return () => {
        eventTarget.removeEventListener(TOAST_EVENT, handler);
    };
};