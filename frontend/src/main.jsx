import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './styles.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) return;
    api.get('/api/tasks', { headers: authHeaders })
      .then((res) => setTasks(res.data.tasks))
      .catch(() => setMessage('Could not load tasks. Please log in again.'));
  }, [token, authHeaders]);

  async function submitAuth(event) {
    event.preventDefault();
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : form;
    const res = await api.post(path, payload);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setMessage(`${mode === 'login' ? 'Logged in' : 'Registered'} successfully.`);
  }

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const res = await api.post('/api/tasks', { title }, { headers: authHeaders });
    setTasks([res.data.task, ...tasks]);
    setTitle('');
  }

  async function toggleTask(task) {
    const res = await api.put(`/api/tasks/${task._id}`, { completed: !task.completed }, { headers: authHeaders });
    setTasks(tasks.map((item) => (item._id === task._id ? res.data.task : item)));
  }

  async function deleteTask(taskId) {
    await api.delete(`/api/tasks/${taskId}`, { headers: authHeaders });
    setTasks(tasks.filter((task) => task._id !== taskId));
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setTasks([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-5xl gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">DevOps Portfolio App</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Task Management</h1>
          <p className="mt-4 text-slate-700">
            React frontend, Node.js microservices, MongoDB Atlas, Jenkins, Docker, Helm, ArgoCD, and Kubernetes.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {!token ? (
            <form onSubmit={submitAuth} className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'tab-active' : 'tab'}>Login</button>
                <button type="button" onClick={() => setMode('register')} className={mode === 'register' ? 'tab-active' : 'tab'}>Register</button>
              </div>
              {mode === 'register' && (
                <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              )}
              <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button className="button" type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <button className="text-sm font-medium text-cyan-700" onClick={logout}>Logout</button>
              </div>
              <form onSubmit={addTask} className="flex gap-2">
                <input className="input" placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} />
                <button className="button w-28" type="submit">Add</button>
              </form>
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={task._id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <button className={task.completed ? 'line-through text-slate-500' : ''} onClick={() => toggleTask(task)}>{task.title}</button>
                    <button className="text-sm text-rose-700" onClick={() => deleteTask(task._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
