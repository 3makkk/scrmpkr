import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:roomId" element={<Room />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
