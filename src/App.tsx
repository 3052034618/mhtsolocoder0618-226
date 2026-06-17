import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ScriptEditor from "@/pages/ScriptEditor";
import ExportCards from "@/pages/ExportCards";
import MaterialManagement from "@/pages/MaterialManagement";
import Library from "@/pages/Library";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/project/:projectId" element={<ScriptEditor />} />
          <Route path="/project/:projectId/export" element={<ExportCards />} />
          <Route path="/project/:projectId/materials" element={<MaterialManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
}
