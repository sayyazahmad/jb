import {createRoot} from 'react-dom/client';
import AdminApp from './AdminApp.tsx';
import {registerServiceWorker} from '../registerServiceWorker';
import '../index.css';

createRoot(document.getElementById('root')!).render(<AdminApp />);

// Never reload under an admin who is filling in an Add/Edit form (donation or expense); the update
// applies on the next screen
registerServiceWorker({canReload: () => !/^\/admin\/(expenses\/)?(new|edit)(\/|$)/.test(window.location.pathname)});
