import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioPlayer(src) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize audio object when src changes
    if (src) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      audioRef.current = new Audio(src);
      // Preload the audio to make playback start quickly
      audioRef.current.load();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [src]);

  const playSnippet = useCallback((startTime, duration) => {
    if (!audioRef.current) return;
    
    // Stop any existing playback and clear timers
    audioRef.current.pause();
    if (timerRef.current) clearTimeout(timerRef.current);

    // Set the start time
    audioRef.current.currentTime = startTime;

    // Start playing
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      
      // Stop playing after 'duration' seconds
      timerRef.current = setTimeout(() => {
        audioRef.current.pause();
        setIsPlaying(false);
      }, duration * 1000); // duration in seconds
    }).catch(err => {
      console.error("Audio playback failed:", err);
      setIsPlaying(false);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, []);

  return { playSnippet, stop, isPlaying };
}
