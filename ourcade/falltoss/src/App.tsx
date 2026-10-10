import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createEngine } from './game/engine';
import {
  LEAF_CHARS,
  LEAF_COUNT,
  LEVELS,
  ROUND_SECONDS,
  ROUND_SIZE,
  pick,
} from './game/constants';
import {
  getBoard,
  insertScore,
  loadScores,
  qualifies,
} from './game/leaderboard';
import type {
  AttemptOutcome,
  FinishResult,
  GameEngine,
  GameLevel,
  Screen,
} from './game/types';

/* ------------------------------------------------------------------ leaves */
function Leaves() {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const leaves = useMemo(() => {
    const n = reduce ? 7 : LEAF_COUNT;
    return Array.from({ length: n }, () => {
      const size = 14 + Math.random() * 34;
      const dur = (size < 24 ? 8 : 5) + Math.random() * 4;
      const style: CSSProperties = reduce
        ? { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${size}px` }
        : {
            left: `${Math.random() * 100}%`,
            fontSize: `${size}px`,
            animationDuration: `${dur.toFixed(1)}s`,
            animationDelay: `${(-Math.random() * dur).toFixed(1)}s`,
            filter: size < 20 ? 'blur(0.6px)' : undefined,
          };
      return { ch: pick(LEAF_CHARS), style };
    });
  }, [reduce]);

  return (
    <div className="leaves" aria-hidden>
      {leaves.map((l, i) => (
        <span className="leaf" key={i} style={l.style}>
          {l.ch}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- board rows */
function BoardRows({
  level,
  highlight = -1,
}: {
  level: GameLevel;
  highlight?: number;
}) {
  const rows = [0, 1, 2].map(
    (i) => getBoard(level)[i] ?? { i: 'XYZ', score: null as number | null },
  );
  return (
    <>
      {rows.map((e, i) => (
        <div className={`brow${highlight === i ? ' hl' : ''}`} key={i}>
          <span className="rank">{i + 1}</span>
          <span className="ini">{e.i}</span>
          <span className="score-count">{e.score === null ? '—' : `${e.score} dunks`}</span>
        </div>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- menu view */
function Menu({
  level,
  onLevel,
  onStart,
  onLeaderboard,
}: {
  level: GameLevel;
  onLevel: (v: GameLevel) => void;
  onStart: () => void;
  onLeaderboard: () => void;
}) {
  return (
    <div className="overlay menu-overlay">
      <Leaves />
      <div className="panel">
        <h1 className="marsh-title">
          Marshmallow Toss <span aria-hidden>🍁</span>
        </h1>
        <div className="segwrap">
          <div className="seglabel">Difficulty</div>
          <div className="seg" role="group" aria-label="Choose difficulty">
            {(Object.keys(LEVELS) as GameLevel[]).map((key) => (
              <button
                key={key}
                className={level === key ? 'on' : ''}
                aria-pressed={level === key}
                onClick={() => onLevel(key)}
              >
                {LEVELS[key].label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn" onClick={onStart}>
          Start Tossing
        </button>
        <button className="btn" onClick={onLeaderboard}>
          View Leaderboard
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- hud view */
function Hud({
  score,
  attempts,
  timeLeft,
  status,
  onMenu,
}: {
  score: number;
  attempts: AttemptOutcome[];
  timeLeft: number;
  status: string;
  onMenu: () => void;
}) {
  return (
    <>
      <div className="life-track" aria-label={`${attempts.length} of ${ROUND_SIZE} marshmallows used`}>
        {Array.from({ length: ROUND_SIZE }, (_, i) => {
          const outcome = attempts[i];
          return (
            <span
              className={`life-token${outcome ? ` ${outcome}` : ''}`}
              key={i}
              aria-label={
                outcome === 'made'
                  ? 'Dunked'
                  : outcome === 'missed'
                    ? 'Missed'
                    : 'Remaining'
              }
            />
          );
        })}
      </div>
      <div className="board">
        <div className="pcard p1 active">
          <span className="score-label">Dunks</span>
          <span className="pscore">{score}<span className="score-total">/{ROUND_SIZE}</span></span>
        </div>
        <div className={`timerchip${timeLeft <= 10 ? ' low' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="tlabel">Time</span>
            <span className="tval">{Math.ceil(timeLeft)}</span>
          </div>
        </div>
        <button className="menupill" onClick={onMenu} aria-label="Main menu">
          ☰ <span className="menu-label">Menu</span>
        </button>
      </div>
      <div className="turnpill">{status}</div>
    </>
  );
}

/* ---------------------------------------------------------------- end view */
function EndScreen({
  result,
  onPlayAgain,
  onMainMenu,
  onScoresChanged,
}: {
  result: FinishResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onScoresChanged: () => void;
}) {
  const canRank = useMemo(
    () => qualifies(result.level, result.score),
    // evaluate once, before any insert
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [initials, setInitials] = useState('');
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const showInitials = canRank && savedIdx === null;
  const save = () => {
    const clean = initials.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'XYZ';
    const idx = insertScore(result.level, clean, result.score);
    setSavedIdx(idx);
    onScoresChanged();
  };

  return (
    <div className="overlay">
      <Leaves />
      <div className="panel">
        <h1>Round complete!</h1>
        {showInitials && (
          <div className="banner">New top-3 dunk score!</div>
        )}
        {savedIdx !== null && <div className="banner">Saved to the board!</div>}
        <p className="sub">
          Dunked {result.score} of {ROUND_SIZE}.
        </p>

        {showInitials && (
          <div className="initials">
            <div className="seglabel">Enter your initials</div>
            <input
              value={initials}
              maxLength={3}
              placeholder="AAA"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) =>
                setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))
              }
            />
            <button className="btn" onClick={save}>
              Save score
            </button>
          </div>
        )}

        <div className="boardbox">
          <div className="boardtitle">{LEVELS[result.level].label} Leaderboard</div>
          <BoardRows level={result.level} highlight={savedIdx ?? -1} />
        </div>

        <div className="btnrow">
          <button className="btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="btn" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- leaderboard view */
function Leaderboard({ onBack }: { onBack: () => void }) {
  return (
    <div className="overlay z60">
      <div className="panel wide">
        <h1>Leaderboard 🍁</h1>
        <p className="sub">Highest dunk counts for each level.</p>
        <div className="lgrid">
          {(Object.keys(LEVELS) as GameLevel[]).map((level) => (
            <div className="boardbox level-board" key={level}>
              <div className="boardtitle">{LEVELS[level].label}</div>
              <BoardRows level={level} />
            </div>
          ))}
        </div>
        <button className="btn" onClick={onBack}>
          Main Menu
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- confirm view */
function ConfirmDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <div className="overlay z60">
      <div className="panel">
        <h1>Leave this run?</h1>
        <p className="sub">Your progress this round won't be saved.</p>
        <div className="btnrow">
          <button className="btn" onClick={onStay}>
            Keep Playing
          </button>
          <button className="btn" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- app */
export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<GameLevel>('beginner');

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<AttemptOutcome[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [status, setStatus] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [endInfo, setEndInfo] = useState<FinishResult | null>(null);
  const [, setScoresVersion] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    loadScores();
    if (!canvasRef.current) return;
    const engine = createEngine(canvasRef.current, {
      onScore: setScore,
      onAttempts: setAttempts,
      onTick: setTimeLeft,
      onStatus: setStatus,
      onFinish: (r) => {
        setEndInfo(r);
        setScreen('end');
      },
    });
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  const startRun = (selectedLevel: GameLevel) => {
    setScreen('playing');
    setLevel(selectedLevel);
    setAttempts([]);
    engineRef.current?.start(selectedLevel);
  };

  const onMenuPill = () => {
    engineRef.current?.pause();
    setConfirmOpen(true);
  };
  const confirmStay = () => {
    engineRef.current?.resume();
    setConfirmOpen(false);
  };
  const confirmLeave = () => {
    engineRef.current?.stop();
    setConfirmOpen(false);
    setScreen('menu');
  };

  return (
    <div className="wrap" data-level={level}>
      {screen === 'playing' && (
        <Hud
          score={score}
          attempts={attempts}
          timeLeft={timeLeft}
          status={status}
          onMenu={onMenuPill}
        />
      )}

      <div className="stage">
        <canvas ref={canvasRef} />
      </div>

      {screen === 'menu' && (
        <Menu
          level={level}
          onLevel={setLevel}
          onStart={() => startRun(level)}
          onLeaderboard={() => setLeaderOpen(true)}
        />
      )}

      {screen === 'end' && endInfo && (
        <EndScreen
          result={endInfo}
          onPlayAgain={() => startRun(endInfo.level)}
          onMainMenu={() => setScreen('menu')}
          onScoresChanged={() => setScoresVersion((v) => v + 1)}
        />
      )}

      {leaderOpen && <Leaderboard onBack={() => setLeaderOpen(false)} />}
      {confirmOpen && <ConfirmDialog onStay={confirmStay} onLeave={confirmLeave} />}
    </div>
  );
}
