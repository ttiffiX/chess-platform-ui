import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './features/auth/context/AuthContext';
import {AppRoutes} from './routes/AppRoutes';
import {ToastProvider} from './shared/notifications/providers/ToastProvider';

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes/>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;