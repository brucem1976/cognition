import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SignIn from './features/auth/SignIn';
import SignUp from './features/auth/SignUp';
import ForgotPassword from './features/auth/ForgotPassword';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="p-4 bg-white shadow flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">Cognition</Link>
        <div className="flex gap-4">
          <Link to="/signin" className="hover:text-blue-600">Sign In</Link>
          <Link to="/signup" className="hover:text-blue-600">Sign Up</Link>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={
            <div className="text-center mt-20">
              <h1 className="text-4xl font-bold mb-4">Welcome to Cognition</h1>
              <p className="text-xl text-gray-600">Distributed Application Foundation</p>
            </div>
          } />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
