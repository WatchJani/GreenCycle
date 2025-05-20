import { useState } from 'react';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();

    const [form, setForm] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await loginUser(form);
            if (res.data && res.data.user) {
                login(res.data.user);
            }
            console.log('Login successful:', res.data);
        } catch (err) {
            console.error('Login error:', err.response?.data || err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
            />
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;