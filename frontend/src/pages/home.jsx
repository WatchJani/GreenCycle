import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {user ? (
                <p>Welcome, {user.username}!</p>
            ) : (
                <p>You are not logged in.</p>
            )}
        </div>
    );
};

export default Home;