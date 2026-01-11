import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import CreateBatch from './pages/CreateBatch';
import BatchDetail from './pages/BatchDetail';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/:id/edit" element={<CreateRecipe />} />
          <Route path="/batches/:id" element={<BatchDetail />} />
          <Route path="/batches/:batchId/edit" element={<CreateBatch />} />
          <Route path="/new-recipe" element={<CreateRecipe />} />
          <Route path="/recipes/:recipeId/new-batch" element={<CreateBatch />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
