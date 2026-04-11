import AppRoutes from "./routes/AppRoutes";
import { useAppearance } from "./components/AppearanceProvider.jsx";

function App() {
  const { theme } = useAppearance();

  return (
    <div className="app-container min-h-screen transition-colors duration-300" data-theme={theme}>
      <AppRoutes />
    </div>
  );
}

export default App;
