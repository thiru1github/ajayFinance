import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext.tsx';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Customers } from './components/Customers.tsx';
import { Products } from './components/Products.tsx';
import { Applications } from './components/Applications.tsx';
import { Collections } from './components/Collections.tsx';
import { EarlyClosure } from './components/EarlyClosure.tsx';
import { Reports } from './components/Reports.tsx';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/early-closure" element={<EarlyClosure />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </Router>
    </StoreProvider>
  );
};

export default App;
