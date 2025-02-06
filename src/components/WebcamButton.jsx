import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import useVideoStore from '../store/videoStore';

const WebcamButton = () => {
    const { isWebcamActive, toggleWebcam, videos, setCurrentVideo } = useVideoStore();

    const handleWebcamToggle = async () => {
        if (isWebcamActive) {
            await toggleWebcam();
            setCurrentVideo(videos[0], false);
        } else {
            await toggleWebcam();
        }
    };

    return (
        <button
            onClick={handleWebcamToggle}
            className="text-white text-xl hover:text-gray-300 transition-colors"
            title={isWebcamActive ? "Выключить камеру" : "Включить камеру"}
        >
            {isWebcamActive ? <FaVideoSlash /> : <FaVideo />}
        </button>
    );
};

export default WebcamButton;