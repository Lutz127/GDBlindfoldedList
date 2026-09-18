import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Admin from './pages/Admin.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/admin', component: Admin },
];
