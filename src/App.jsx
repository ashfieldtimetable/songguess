import { useState, useEffect } from 'react';
import './index.css';
import { checkGuess } from './utils/stringUtils';
import { useAudioPlayer } from './hooks/useAudioPlayer';

const LEVELS = [
  { name: 'Extreme', duration: 0.1, points: 100 },
  { name: 'Hard', duration: 0.5, points: 80 },
  { name: 'Medium', duration: 1.0, points: 60 },
  { name: 'Easy', duration: 2.0, points: 40 },
  { name: 'Very Easy', duration: 4.0, points: 20 }
];

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState('LOADING'); // 'LOADING', 'PLAYING', 'REVEAL'
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isCorrect, setIsCorrect] = useState(false);

  const currentSong = songs[currentSongIndex];
  
  // Audio player hook
  const audioSrc = currentSong ? `/Songs/${currentSong.filename}` : null;
  const { playSnippet, stop, isPlaying } = useAudioPlayer(audioSrc);

  useEffect(() => {
    // Fetch metadata
    fetch('/Songs/metadata.json')
      .then(res => res.json())
      .then(data => {
        // Shuffle songs
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setSongs(shuffled);
        if (shuffled.length > 0) {
          setupNewSong(shuffled[0]);
          setGameState('PLAYING');
        }
      })
      .catch(err => {
        console.error("Failed to load metadata", err);
        setMessage({ text: 'Error loading songs. Did you add metadata.json?', type: 'error' });
      });
  }, []);

  const setupNewSong = (song) => {
    setCurrentLevel(0);
    setGuess('');
    setMessage({ text: '', type: '' });
    setIsCorrect(false);
    
    // Pick a random start time. Max duration is LEVELS[LEVELS.length - 1].duration (4.0s)
    const maxDuration = LEVELS[LEVELS.length - 1].duration;
    // Ensure we don't start too close to the end
    const maxStartTime = Math.max(0, song.length - maxDuration);
    const randomStart = Math.random() * maxStartTime;
    setStartTime(randomStart);
  };

  const handlePlay = () => {
    if (!currentSong) return;
    const duration = LEVELS[currentLevel].duration;
    playSnippet(startTime, duration);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim() || gameState !== 'PLAYING') return;

    const isMatch = checkGuess(guess, currentSong.title);

    if (isMatch) {
      // Correct guess!
      stop();
      const earnedPoints = LEVELS[currentLevel].points;
      setScore(prev => prev + earnedPoints);
      setIsCorrect(true);
      setMessage({ text: `Correct! +${earnedPoints} points`, type: 'success' });
      setGameState('REVEAL');
    } else {
      // Incorrect guess
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
        setMessage({ text: 'Incorrect! The snippet is now longer.', type: 'error' });
        setGuess('');
      } else {
        // Game Over for this song
        stop();
        setIsCorrect(false);
        setMessage({ text: 'Out of attempts!', type: 'error' });
        setGameState('REVEAL');
      }
    }
  };

  const nextSong = () => {
    const nextIdx = currentSongIndex + 1;
    if (nextIdx < songs.length) {
      setCurrentSongIndex(nextIdx);
      setupNewSong(songs[nextIdx]);
      setGameState('PLAYING');
    } else {
      setMessage({ text: `Game Over! Final Score: ${score}`, type: 'info' });
      setGameState('END');
    }
  };

  if (gameState === 'LOADING') {
    return (
      <div className="app-container">
        <div className="glass-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // Determine dynamic background blur
  const bgStyle = currentSong && currentSong.albumCover
    ? { backgroundImage: `url(${currentSong.albumCover})` }
    : { backgroundColor: 'var(--bg-color)' };

  return (
    <>
      <div className="background-blur" style={bgStyle}></div>
      <div className="app-container">
        <div className="glass-card">
          
          {gameState === 'END' ? (
            <div>
              <h1>Game Complete!</h1>
              <div className="song-title">Final Score: {score}</div>
              <button className="submit-btn" onClick={() => window.location.reload()} style={{ marginTop: '2rem' }}>
                Play Again
              </button>
            </div>
          ) : (
            <>
              <div className="score-board">
                <span>Score: {score}</span>
                <span>Song {currentSongIndex + 1}/{songs.length}</span>
              </div>

              {gameState === 'PLAYING' && (
                <>
                  <h1>Guess the Song</h1>
                  <p className="subtitle">Listen to the snippet and type the name</p>

                  <div style={{ marginBottom: '1rem' }}>
                    <span className="difficulty-badge">
                      Difficulty: {LEVELS[currentLevel].name} ({LEVELS[currentLevel].duration}s)
                    </span>
                  </div>

                  <div className="play-area">
                    <button 
                      className={`play-button ${isPlaying ? 'playing' : ''}`} 
                      onClick={handlePlay}
                      title="Play Snippet"
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="guess-section">
                    <input
                      type="text"
                      className="guess-input"
                      placeholder="Type the song title..."
                      value={guess}
                      onChange={e => setGuess(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="submit-btn">Guess</button>
                    <button 
                      type="button" 
                      className="skip-btn" 
                      onClick={() => {
                        setIsCorrect(false);
                        setMessage({ text: 'Skipped!', type: 'info' });
                        setGameState('REVEAL');
                      }}
                    >
                      Skip Song
                    </button>
                  </form>
                </>
              )}

              {gameState === 'REVEAL' && (
                <div className="result-screen">
                  {currentSong.albumCover && (
                    <img src={currentSong.albumCover} alt="Album Cover" className="album-cover" />
                  )}
                  <div className="song-title">{currentSong.title}</div>
                  <div className="song-artist">{currentSong.artist}</div>
                  {currentSong.album && currentSong.album !== 'Unknown Album' && (
                    <div className="song-artist" style={{ fontSize: '1rem', marginTop: '-1.5rem', opacity: 0.8 }}>
                      Album: {currentSong.album}
                    </div>
                  )}
                  <button className="submit-btn" onClick={nextSong}>
                    Next Song
                  </button>
                </div>
              )}

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default App;
