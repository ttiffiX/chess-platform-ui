import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './context/AuthContext';
import {AppRoutes} from './routes/AppRoutes';
import {ToastProvider} from './context/ToastContext';

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