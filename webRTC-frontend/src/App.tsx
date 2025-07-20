import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Room from "./page/Room.tsx";
import Home from "./page/Home.tsx";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}