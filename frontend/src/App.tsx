/**
 * App.tsx
 * 
 * Root component that sets up the React Router and defines the navigation
 * paths for the entire AI Mock Interview application.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import JobDescription from './pages/JobDescription';
import Upload from './pages/Upload';
import Interview from './pages/Interview';
import Report from './pages/Report';

/**
 * App component initializing application routing.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/jd" element={<JobDescription />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
