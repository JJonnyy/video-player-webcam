import { FaPlay } from 'react-icons/fa';
import { useShallow } from 'zustand/react/shallow';
import useVideoStore from '../store/videoStore';
import useThemeStore from '../store/ThemeStore';

const Playlist = () => {
    const { theme } = useThemeStore();
    const { videos, currentVideo } = useVideoStore(
        useShallow(state => ({
            videos: state.videos,
            currentVideo: state.currentVideo,
            setCurrentVideo: state.setCurrentVideo,
        }))
    );

    const completedVideos = videos.filter(video => video.completed).length;
    const progress = Math.round((completedVideos / videos.length) * 100);

    const totalDuration = videos.reduce((total, video) => total + (video.duration || 0), 0);
    const formatTotalDuration = (minutes) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const handleLessonSelect = async (video) => {
        const store = useVideoStore.getState();

        if (store.isWebcamActive) {
            if (store.isRecording) {
                store.stopRecording();
            }
            if (store.webcamStream) {
                store.webcamStream.getTracks().forEach(track => track.stop());
            }
            useVideoStore.setState({
                webcamStream: null,
                isWebcamActive: false,
                isRecording: false,
                mediaRecorder: null
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        store.setCurrentVideo(video, true);
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-4 rounded-lg`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg">List of videos</h2>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center">
                        <span className="text-sm ">{progress}%</span>
                    </div>
                    <span className="text-gray-400">{formatTotalDuration(totalDuration)}</span>
                </div>
            </div>

            <div className="space-y-2">
                {videos.map((video, index) => (
                    <button
                        key={video.id}
                        onClick={() => handleLessonSelect(video)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg ${
                            currentVideo?.id === video.id ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                    currentVideo?.id === video.id ? 'bg-blue-500' : 'border border-gray-600'
                                }`}
                            >
                                {currentVideo?.id === video.id && <FaPlay className="text-white text-sm" />}
                            </div>
                            <span className="">{`${index + 1}. ${video.title}`}</span>
                        </div>
                        <span className="text-gray-400">{video.duration}min</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Playlist;