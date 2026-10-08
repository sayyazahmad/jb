import {createRoot} from 'react-dom/client';
import AdminApp from './AdminApp.tsx';
import {registerServiceWorker} from '../registerServiceWorker';
import '../index.css';

createRoot(document.getElementById('root')!).render(<AdminApp />);

// Never reload under an admin who is filling in the Add/Edit form; the update applies on the next screen
registerServiceWorker({canReload: () => !/^\/admin\/(new|edit)(\/|$)/.test(window.location.pathname)});
