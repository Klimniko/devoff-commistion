import React, { useEffect, useState } from "react";
import DeveloperPricingTracker from "./DeveloperPricingTracker";
import logo from "./logo.svg";

const users = { hugo: "hugo$", kliment: "kliment$", arnaud: "arnaud$" };
const SESSION_KEY = "session_v1";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session.username && session.expiresAt && Date.now() < session.expiresAt) {
        setIsLoggedIn(true);
        setUsername(session.username);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
  }, []);

  const login = (e) => {
    e.preventDefault();
    if (users[username] && users[username] === password) {
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username, expiresAt }));
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (isLoggedIn) {
    return <DeveloperPricingTracker currentUser={username} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6 flex">
      <div className="card w-full max-w-sm sm:max-w-md m-auto p-8 bg-white/90 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Company Logo" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow mb-4" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-700">Developers Offshore</h1>
        </div>

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Insert your username" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-full">Login</button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
