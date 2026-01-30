import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Interview from "@/pages/Interview";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
import Settings from "@/pages/Settings";
import Import from "@/pages/Import";
import Questions from "@/pages/Questions";
import QuestionEdit from "@/pages/QuestionEdit";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Toaster } from "sonner";

export default function App() {
  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <ProtectedRoute>
              <HistoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/:topic"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questions"
          element={
            <ProtectedRoute>
              <Questions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questions/edit/:id"
          element={
            <ProtectedRoute>
              <QuestionEdit />
            </ProtectedRoute>
          }
        />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
