import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { FaPlay, FaPause, FaExpand, FaCompress, FaBackward, FaForward, FaRecordVinyl, FaStop } from 'react-icons/fa';
import { IoSettingsSharp } from 'react-icons/io5';
import { useShallow } from 'zustand/react/shallow';
import useVideoStore from '../store/videoStore';
import WebcamButton from "./WebcamButton.jsx";


const VideoPlayer = () => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showQualityMenu, setShowQualityMenu] = React.useState(false);

    const playerRef = useRef(null);
    const videoRef = useRef(null);
    const playerInitialized = useRef(false);

    const {
        currentVideo,
        isPlaying,
        currentTime,
        duration,
        volume,
        videos,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setVolume,
        playNextVideo,
        setCurrentVideo,
        isWebcamActive,
        webcamStream,
        startRecording,
        stopRecording,
        isRecording
    } = useVideoStore(
        useShallow(state => ({
            currentVideo: state.currentVideo,
            isPlaying: state.isPlaying,
            currentTime: state.currentTime,
            duration: state.duration,
            volume: state.volume,
            videos: state.videos,
            setIsPlaying: state.setIsPlaying,
            setCurrentTime: state.setCurrentTime,
            setDuration: state.setDuration,
            setVolume: state.setVolume,
            playNextVideo: state.playNextVideo,
            setCurrentVideo: state.setCurrentVideo,
            isWebcamActive: state.isWebcamActive,
            webcamStream: state.webcamStream,
            startRecording: state.startRecording,
            stopRecording: state.stopRecording,
            isRecording: state.isRecording,
        }))
    );

    // First video initialization
    useEffect(() => {
        if (!currentVideo && videos.length > 0) {
            const lastId = localStorage.getItem('lastVideoId');
            const initialVideo = videos.find(v => v.id === Number(lastId)) || videos[0];
            setCurrentVideo(initialVideo);
        }
    }, [currentVideo, videos, setCurrentVideo]);


    // Player initialization
    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            fluid: true,
            controls: false,
            autoplay: false,
            playsinline: true,
            poster:currentVideo?.thumbnail,
        });

        playerRef.current = player;
        playerInitialized.current = true;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => setVolume(player.volume());
        const handleTimeUpdate = () => setCurrentTime(player.currentTime());
        const handleLoadedMetadata = () => setDuration(player.duration());
        const handleEnded = () => playNextVideo();

        player.on('play', handlePlay);
        player.on('pause', handlePause);
        player.on('volumechange', handleVolumeChange);
        player.on('timeupdate', handleTimeUpdate);
        player.on('loadedmetadata', handleLoadedMetadata);
        player.on('ended', handleEnded);

        return () => {
            if (player) {
                player.off('play', handlePlay);
                player.off('pause', handlePause);
                player.off('volumechange', handleVolumeChange);
                player.off('timeupdate', handleTimeUpdate);
                player.off('loadedmetadata', handleLoadedMetadata);
                player.off('ended', handleEnded);
                player.dispose();
                playerInitialized.current = false;
            }
        };
    }, []);

    // initialize player with current video
    useEffect(() => {
        const player = playerRef.current;
        if (!player || !currentVideo) return;

        const handleSourceChange = async () => {
            try {
                await player.pause();
                player.src('');

                const tech = player.tech({ IWillNotUseThisInPlugins: true });
                if (tech && tech.el()) {
                    tech.el().srcObject = null;
                }

                if (isWebcamActive && webcamStream) {
                    tech.el().srcObject = webcamStream;
                    player.poster('');
                    if (isPlaying) await player.play().catch(() => {});
                }

                else if (currentVideo?.url) {
                    tech.el().srcObject = null;
                    player.src({ src: currentVideo.url, type: 'video/mp4' });
                    player.poster(currentVideo.thumbnail || '');

                    if (isPlaying) await player.play().catch(() => {});
                }
            } catch (error) {
                console.error('Source handling error:', error);
                setIsPlaying(false);
            }
        };

        // Add small delay to ensure proper state transition
        setTimeout(handleSourceChange, 100);
    }, [currentVideo, isWebcamActive, webcamStream]);

    useEffect(() => {
        if (currentVideo?.id && currentVideo.id !== 'webcam') {
            localStorage.setItem('lastVideoId', currentVideo.id);
        }
    }, [currentVideo]);


    const handlePlayPause = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play().catch(error => {
                    console.error('Error attempting to play:', error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const handleSeek = e => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.currentTime(time);
        }
    };

    const handleVolume = e => {
        const newVolume = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.volume(newVolume);
        }
    };

    const skip = seconds => {
        if (playerRef.current) {
            const newTime = playerRef.current.currentTime() + seconds;
            playerRef.current.currentTime(newTime);
        }
    };

    const toggleFullscreen = () => {
        if (playerRef.current) {
            isFullscreen
                ? playerRef.current.exitFullscreen()
                : playerRef.current.requestFullscreen();
            setIsFullscreen(!isFullscreen);
        }
    };

    const formatTime = seconds => {
        const minutes = Math.floor(seconds / 60);
        const remaining = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full h-full">
            <video
                ref={videoRef}
                className="video-js vjs-big-play-centered w-full h-full"
            >
                <p className="vjs-no-js">
                    Для просмотра видео включите JavaScript
                </p>
            </video>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4">
                <div className="flex items-center gap-4 justify-between">
                    <button
                        onClick={handlePlayPause}
                        className="text-white text-xl"
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    {!isWebcamActive && (
                        <>
                            <button onClick={() => skip(-30)} className="text-white">
                                <FaBackward/>
                            </button>
                            <button onClick={() => skip(30)} className="text-white">
                                <FaForward/>
                            </button>
                        </>

                    )}
                    <WebcamButton/>
                    {isWebcamActive && (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`text-white ${isRecording ? 'text-red-500' : ''}`}
                        >
                            {isRecording ? <FaStop style={{color:"red"}} /> : <FaRecordVinyl style={{color:"red"}}/>}
                        </button>
                    )}
                    {!isWebcamActive && (
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-white text-sm">
                                {formatTime(currentTime)}
                            </span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="flex-1 h-1 bg-gray-600 rounded-full slider-thumb cursor-pointer"
                            />
                            <span className="text-white text-sm">
                                {formatTime(duration)}
                            </span>
                        </div>
                    )}

                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolume}
                        className="w-20 h-1 bg-gray-600 rounded-full slider-thumb"
                    />

                    <div className="relative">
                        <button
                            onClick={() => setShowQualityMenu(!showQualityMenu)}
                            className="text-white"
                        >
                            <IoSettingsSharp />
                        </button>
                        {showQualityMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]">
                                {['1080p', '720p', '480p', '360p', '240p', '144p'].map(quality => (
                                    <button
                                        key={quality}
                                        className="block w-full text-left px-3 py-1 text-white hover:bg-white/10 rounded"
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={toggleFullscreen} className="text-white">
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;