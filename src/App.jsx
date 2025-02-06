import VideoPlayer from './components/VideoPlayer';
import Playlist from './components/Playlist';
import useThemeStore from './store/ThemeStore';

function App() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <header className="p-4 flex justify-between items-center ">
                <div className="max-w-[1124px] w-full flex justify-between items-center m-auto">
                    <h1 className="text-2xl font-bold">Player</h1>
                    <div className="flex">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>
            </header>
            <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr,1fr] gap-6 px-3">
                <VideoPlayer/>
                <Playlist/>
            </div>
        </div>
    );
}

export default App; 