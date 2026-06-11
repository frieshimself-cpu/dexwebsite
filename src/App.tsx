import { Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Footer from "./components/Footer";
import { BoostModalProvider } from "./context/BoostModalContext";
import BoostModal from "./components/BoostModal";

const Screener = lazy(() => import("./pages/Screener"));
const TokenDetail = lazy(() => import("./pages/TokenDetail"));
const Admin = lazy(() => import("./pages/Admin"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(
        () => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }),
        80
      );
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <img src="/logo.png" alt="" className="h-16 w-16 animate-floaty rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <BoostModalProvider>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Screener />} />
          <Route path="/token/:address" element={<TokenDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
      <Footer />
      <BoostModal />
    </BoostModalProvider>
  );
}
