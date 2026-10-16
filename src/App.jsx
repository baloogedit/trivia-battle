import {useState, useEffect, useCallback} from 'react';
import {motion} from 'framer-motion';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameStarted, setGameStarted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [playerName, setPlayerName] = useState('');

  // 1. JAVÍTÁS: Ponttáblázat betöltése közvetlenül inicializáláskor (nincs szükség useEffect-re)
  const [leaderboard, setLeaderboard] = useState(() => {
    const savedScores = localStorage.getItem('triviaScores');
    return savedScores ? JSON.parse(savedScores) : [];
  });

  // 2. & 3. JAVÍTÁS: A handleAnswer feljebb került és useCallback-et használ,
  // hogy biztonságosan hivatkozhassunk rá a lentebbi useEffect-ben.
  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer);

      // Opcionális láncolás (optional chaining), hogy elkerüljük a hibákat az időzítő lejártakor
      const isCorrect = answer && answer === questions[currentQIndex]?.correct_answer;

      if (isCorrect) {
        setScore((prevScore) => prevScore + 1);
      }

      setTimeout(() => {
        if (currentQIndex + 1 < questions.length) {
          setCurrentQIndex((prevIndex) => prevIndex + 1);
          setTimeLeft(10);
          setSelectedAnswer(null);
        } else {
          setGameOver(true);
        }
      }, 1500);
    },
    [questions, currentQIndex],
  );

  // Időzítő logika (most már a handleAnswer után van, így látja azt)
  useEffect(() => {
    if (gameStarted && !gameOver && !selectedAnswer && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selectedAnswer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleAnswer(null); // Lejárt az idő
    }
  }, [timeLeft, gameStarted, gameOver, selectedAnswer, handleAnswer]);

  const startGame = async () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCurrentQIndex(0);
    setTimeLeft(10);
    setSelectedAnswer(null);

    const res = await fetch(
      `https://opentdb.com/api.php?amount=5&difficulty=${difficulty}&type=multiple`,
    );
    const data = await res.json();

    const formattedQuestions = data.results.map((q) => {
      const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      return {...q, answers};
    });
    setQuestions(formattedQuestions);
  };

  const saveScore = () => {
    if (!playerName) return;
    const newScore = {name: playerName, score: `${score}/${questions.length}`};
    const newLeaderboard = [...leaderboard, newScore].slice(0, 5);
    setLeaderboard(newLeaderboard);
    localStorage.setItem('triviaScores', JSON.stringify(newLeaderboard));
    setPlayerName('');
  };

  if (!gameStarted) {
    return (
      <div className="container">
        <h1>🎮 Trivia Battle</h1>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Könnyű</option>
          <option value="medium">Közepes</option>
          <option value="hard">Nehéz</option>
        </select>
        <button onClick={startGame}>Játék indítása</button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="container">
        <h2>
          Játék vége! Eredményed: {score} / {questions.length}
        </h2>
        <input
          type="text"
          placeholder="Neved"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button onClick={saveScore}>Eredmény mentése</button>
        <button onClick={() => setGameStarted(false)}>Új játék</button>

        <h3>🏆 Top 5 Eredmény</h3>
        <ul>
          {leaderboard.map((l, i) => (
            <li key={i}>
              {l.name} - {l.score}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (questions.length === 0) return <div>Töltés...</div>;

  const currentQ = questions[currentQIndex];

  return (
    <div className="container">
      <h2>
        Kérdés {currentQIndex + 1} / {questions.length}
      </h2>

      <div className="progress-bar-container">
        <motion.div
          className="progress-bar"
          initial={{width: '100%'}}
          animate={{width: `${(timeLeft / 10) * 100}%`}}
          transition={{duration: 1, ease: 'linear'}}
        />
      </div>

      <p dangerouslySetInnerHTML={{__html: currentQ.question}}></p>

      <div className="answers">
        {currentQ.answers.map((ans, i) => {
          let bgColor = '';
          if (selectedAnswer) {
            if (ans === currentQ.correct_answer) bgColor = 'green';
            else if (ans === selectedAnswer) bgColor = 'red';
          }

          return (
            <button
              key={i}
              disabled={!!selectedAnswer}
              style={{backgroundColor: bgColor || '#1f1f1f'}}
              onClick={() => handleAnswer(ans)}
              dangerouslySetInnerHTML={{__html: ans}}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
