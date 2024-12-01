import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './App.css';
import Chat from './pages/Chat.tsx';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/chat/:user_id" element={<Chat />} />
            </Routes>
        </Router>
    );
};

export default App;
