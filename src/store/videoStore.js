import {create} from 'zustand';
import {persist} from "zustand/middleware";

const useVideoStore = create(persist((set, get) => ({
    // Video sources
    videos: [
        {
            id: 1,
            title: 'Big Buck Bunny',
            url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
            duration: 15,
            completed: true
        },
        {
            id: 2,
            title: 'Elephant Dream',
            url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
            duration: 12,
            completed: false
        },
        {
            id: 3,
            title: 'Sintel',
            url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
            duration: 18,
            completed: false
        }
    ],
    playlist: [
        { id: 1, title: 'Sample Video 1', url: 'https://example.com/video1.mp4' },
        { id: 2, title: 'Sample Video 2', url: 'https://example.com/video2.mp4' },
        { id: 3, title: 'Sample Video 3', url: 'https://example.com/video3.mp4' },
    ],

    currentVideo: null,
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    videoComments: {},
    videoRatings: {},
    webcamStream: null,
    isWebcamActive: false,
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,

    // Actions
    setCurrentVideo: (video, autoplay = false) => {
        const currentState = get();

        if (currentState.isWebcamActive) {
            currentState.webcamStream?.getTracks().forEach(track => track.stop());
            localStorage.removeItem('currentVideo');
        }

        set({
            currentVideo: video,
            isPlaying: autoplay,
            isWebcamActive: false,
            webcamStream: null
        });
    },
    toggleVideoComplete: (videoId) => set(state => ({
        videos: state.videos.map(video =>
            video.id === videoId
                ? { ...video, completed: !video.completed }
                : video
        )
    })),
    toggleWebcam: async () => {
        if (get().isWebcamActive) {
            get().webcamStream?.getTracks().forEach(track => track.stop());
            set({
                webcamStream: null,
                isWebcamActive: false,

                currentVideo: get().videos.find(v => v.id === localStorage.getItem('lastVideoId')) || null
            });
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                set({
                    webcamStream: stream,
                    isWebcamActive: true,

                    currentVideo: { id: 'webcam', title: 'Webcam', isWebcam: true }
                });
            } catch (error) {
                console.error('Error accessing webcam:', error);
            }
        }
    },
    startRecording: async () => {
        const stream = get().webcamStream;
        if (stream) {
            // Get supported MIME types for the current browser
            const getMimeType = () => {
                const types = [
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=h264,opus',
                    'video/mp4;codecs=h264,aac',
                    'video/webm',
                    'video/mp4'
                ];

                for (const type of types) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        return type;
                    }
                }
                return '';
            };

            const mimeType = getMimeType();
            if (!mimeType) {
                console.error('No supported MIME type found for recording');
                return;
            }

            try {
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 2500000 // 2.5 Mbps
                });

                const recordedChunks = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) recordedChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunks, { type: mimeType });
                    const url = URL.createObjectURL(blob);

                    const fileExtension = mimeType.includes('webm') ? 'webm' : 'mp4';

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `webcam-recording-${new Date().toISOString()}.${fileExtension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    set({
                        mediaRecorder: null,
                        recordedChunks: [],
                        isRecording: false
                    });
                };

                mediaRecorder.start(1000);

                set({
                    mediaRecorder,
                    recordedChunks,
                    isRecording: true
                });
            } catch (error) {
                console.error('Error starting recording:', error);
                set({
                    mediaRecorder: null,
                    recordedChunks: [],
                    isRecording: false
                });
            }
        }
    },
    stopRecording: () => {
        const { mediaRecorder } = get();
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    },
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setVolume: (volume) => set({ volume }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setDuration: (duration) => set({ duration }),

    addComment: (videoId, comment) => set((state) => ({
        videoComments: {
            ...state.videoComments,
            [videoId]: [...(state.videoComments[videoId] || []), comment],
        },
    })),

    addRating: (videoId, rating) => set((state) => ({
        videoRatings: {
            ...state.videoRatings,
            [videoId]: [...(state.videoRatings[videoId] || []), rating],
        },
    })),

    addToPlaylist: (video) => set((state) => ({
        playlist: [...state.playlist, video],
    })),

    // Playlist management
    addVideo: (video) => set((state) => ({
        videos: [...state.videos, { ...video, id: state.videos.length + 1 }]
    })),

    // Play next video automatically
    playNextVideo: () => set((state) => {
        const currentIndex = state.videos.findIndex(v => v.id === state.currentVideo?.id);
        const nextVideo = state.videos[currentIndex + 1] || state.videos[0];
        return { currentVideo: nextVideo, isPlaying: true };
    })
}),{
    name: 'video_state',
        partialize: (state) => ({
            videos: state.videos,
            playlist: state.playlist,
            currentVideo: state.currentVideo?.id !== 'webcam' ? state.currentVideo : null,
            volume: state.volume,
        }),
        serialize: (state) => {
            const newState = {
                ...state,
                state: {
                    ...state.state,
                    currentVideo: state.state.currentVideo?.id !== 'webcam'
                        ? state.state.currentVideo
                        : null
                }
            }
            return JSON.stringify(newState);
        }
    }
));

export default useVideoStore;