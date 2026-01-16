import React, { useEffect, useState } from 'react';
import api from '../api';
import * as ActivityCalendarPkg from 'react-activity-calendar';

const ActivityCalendar = ActivityCalendarPkg.default || ActivityCalendarPkg;
import { Link } from 'react-router-dom';
import { ArrowLeft, ChefHat, Database, Star } from 'lucide-react';

const StatsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading metrics...</div>;
    }

    if (!stats) return <div className="text-center p-10">Failed to load statistics.</div>;

    // Calendar theme using pickle colors
    const theme = {
        light: ['#ebedf0', '#dcfce7', '#86efac', '#22c55e', '#15803d'],
        dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <Link to="/" className="flex items-center text-gray-500 hover:text-pickle-green-700 transition font-medium">
                        <ArrowLeft size={20} className="mr-2" />
                        Back Home
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Pickle Analytics</h1>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        icon={<ChefHat size={32} />}
                        label="Recipes Created"
                        value={stats.total_recipes}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={<Database size={32} />}
                        label="Batches Logged"
                        value={stats.total_batches}
                        color="bg-purple-50 text-purple-600"
                    />
                    <StatCard
                        icon={<Star size={32} />}
                        label="Avg Batch Rating"
                        value={stats.average_rating}
                        color="bg-yellow-50 text-yellow-600"
                    />
                </div>

                {/* Contribution Graph */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Production Activity</h2>
                        <p className="text-gray-500 text-sm">Batches made over the last year</p>
                    </div>

                    <div className="flex justify-center overflow-x-auto pb-2">
                        <ActivityCalendar
                            data={stats.activity}
                            theme={theme}
                            blockSize={14}
                            blockMargin={4}
                            fontSize={14}
                            hideColorLegend={false}
                            labels={{
                                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                totalCount: '{{count}} batches in the last year',
                                legend: {
                                    less: 'Less',
                                    more: 'More',
                                },
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:shadow-md">
        <div className={`p-4 rounded-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default StatsPage;
