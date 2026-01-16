import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ReactGA from "react-ga4";
import Layout from './components/Layout';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import CreateBatch from './pages/CreateBatch';
import BatchDetail from './pages/BatchDetail';
import LoginModal from './components/LoginModal';
import LandingPage from './pages/LandingPage';
import StatsPage from './pages/StatsPage';
import { useState, useEffect } from 'react';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);
  return null;
};

function App() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const handleAuth = () => setShowLogin(true);
    window.addEventListener('auth:unauthorized', handleAuth);
    return () => window.removeEventListener('auth:unauthorized', handleAuth);
  }, []);

  return (
    <Router>
      <AnalyticsTracker />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Layout Wrapped Routes */}
        <Route path="/stats" element={
          <Layout>
            <StatsPage />
          </Layout>
        } />

        {/* Protected Manager App Routes */}
        <Route path="/manager/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="recipes/:id" element={<RecipeDetail />} />
              <Route path="recipes/:id/edit" element={<CreateRecipe />} />
              <Route path="batches/:id" element={<BatchDetail />} />
              <Route path="batches/:batchId/edit" element={<CreateBatch />} />
              <Route path="new-recipe" element={<CreateRecipe />} />
              <Route path="recipes/:recipeId/new-batch" element={<CreateBatch />} />
            </Routes>
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
