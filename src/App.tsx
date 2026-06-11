import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Screener from "./pages/Screener";
import TokenDetail from "./pages/TokenDetail";
import Footer from "./components/Footer";
import { BoostModalProvider } from "./context/BoostModalContext";
import BoostModal from "./components/BoostModal";

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

export default function App() {
  return (
    <BoostModalProvider>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Screener />} />
        <Route path="/token/:address" element={<TokenDetail />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <Footer />
      <BoostModal />
    </BoostModalProvider>
  );
}
