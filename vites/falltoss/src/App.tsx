import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createEngine } from './game/engine';
import {
  BOARD_DEFS,
  LEAF_CHARS,
  LEAF_COUNT,
  TIME_FOR,
  TIMEUP_MSGS,
  WIN_MSGS,
  pick,
} from './game/constants';
import {
  getBoard,
  insertScore,
  loadScores,
  modeKey,
  modeLabel,
  qualifies,
} from './game/leaderboard';
import type { FinishResult, GameEngine, Screen } from './game/types';

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
function BoardRows({ boardKey, highlight = -1 }: { boardKey: string; highlight?: number }) {
  const rows = [0, 1, 2].map((i) => getBoard(boardKey)[i] ?? { i: 'XYZ', t: null as number | null });
  return (
    <>
      {rows.map((e, i) => (
        <div className={`brow${highlight === i ? ' hl' : ''}`} key={i}>
          <span className="rank">{i + 1}</span>
          <span className="ini">{e.i}</span>
          <span className="time">{e.t == null ? '—' : `${e.t.toFixed(1)}s`}</span>
        </div>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- menu view */
function Menu({
  hard,
  target,
  onHard,
  onTarget,
  onStart,
  onLeaderboard,
}: {
  hard: boolean;
  target: number;
  onHard: (v: boolean) => void;
  onTarget: (v: number) => void;
  onStart: () => void;
  onLeaderboard: () => void;
}) {
  return (
    <div className="overlay">
      <Leaves />
      <div className="panel">
        <h1 className="marsh-title">
          Marshmallow&nbsp;Toss <span aria-hidden>🍁</span>
        </h1>
        <p className="sub">
          Dunk your target number of pumpkin-spice marshmallows before the clock runs out. The faster
          you finish, the higher you climb the board.
        </p>

        <div className="segwrap">
          <div className="seglabel">Difficulty</div>
          <div className="seg">
            <button className={!hard ? 'on' : ''} onClick={() => onHard(false)}>
              Novice
            </button>
            <button className={hard ? 'on' : ''} onClick={() => onHard(true)}>
              Expert
            </button>
          </div>
        </div>

        <div className="segwrap">
          <div className="seglabel">How many can you dunk?</div>
          <div className="seg">
            {[5, 8, 12].map((t) => (
              <button key={t} className={target === t ? 'on' : ''} onClick={() => onTarget(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <button className="btn" onClick={onStart}>
          Start tossing
        </button>
        <button className="btn" onClick={onLeaderboard}>
          View leaderboard
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- hud view */
function Hud({
  score,
  timeLeft,
  status,
  onMenu,
}: {
  score: number;
  timeLeft: number;
  status: string;
  onMenu: () => void;
}) {
  return (
    <>
      <div className="board">
        <div className="pcard p1 active">
          <span className="msico" />
          <span className="pscore">{score}</span>
        </div>
        <div className={`timerchip${timeLeft <= 10 ? ' low' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="tlabel">Time</span>
            <span className="tval">{Math.ceil(timeLeft)}</span>
          </div>
        </div>
        <button className="menupill" onClick={onMenu} aria-label="Main menu">
          ☰ Menu
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
  const key = modeKey(result.target, result.hard);
  const label = `${result.target} Dunks ${modeLabel(result.hard)}`;
  const message = useMemo(
    () => pick(result.won ? WIN_MSGS : TIMEUP_MSGS),
    // one message per end screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const canRank = useMemo(
    () => result.won && qualifies(key, result.finishTime),
    // evaluate once, before any insert
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [initials, setInitials] = useState('');
  const [savedIdx, setSavedIdx] = useState<number | null>(null);

  const showInitials = canRank && savedIdx === null;
  const showBoard = result.won && (!canRank || savedIdx !== null);

  const save = () => {
    const clean = initials.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'XYZ';
    const idx = insertScore(key, clean, result.finishTime);
    setSavedIdx(idx);
    onScoresChanged();
  };

  return (
    <div className="overlay">
      <Leaves />
      <div className="panel">
        <h1>{result.won ? 'You did it!' : "Time's up! 🍂"}</h1>
        {showInitials && (
          <div className="banner">New top-3 time!</div>
        )}
        {savedIdx !== null && <div className="banner">Saved to the board!</div>}
        <p className="sub">
          {message}
          <br />
          <span style={{ opacity: 0.75 }}>
            {result.won
              ? `Finished in ${result.finishTime.toFixed(1)}s.`
              : `Dunked ${result.score} of ${result.target}.`}
          </span>
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

        {showBoard && (
          <div className="boardbox">
            <div className="boardtitle">
              {savedIdx !== null ? `Top 3 · ${label}` : `Top 3 to beat · ${label}`}
            </div>
            <BoardRows boardKey={key} highlight={savedIdx ?? -1} />
          </div>
        )}

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
        <p className="sub">Fastest finishes for each target &amp; difficulty.</p>
        <div className="lgrid">
          {BOARD_DEFS.map((d) => (
            <div className="lcard" key={modeKey(d.t, d.hard)}>
              <h3>
                {d.t} Dunks {modeLabel(d.hard)}
              </h3>
              <BoardRows boardKey={modeKey(d.t, d.hard)} />
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
  const [hard, setHard] = useState(false);
  const [target, setTarget] = useState(5);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_FOR[5]);
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

  const startRun = (t: number, h: boolean) => {
    setScreen('playing');
    engineRef.current?.start({ target: t, hard: h, timeLimit: TIME_FOR[t] });
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
    <div className="wrap">
      {screen === 'playing' && (
        <Hud score={score} timeLeft={timeLeft} status={status} onMenu={onMenuPill} />
      )}

      <div className="stage">
        <canvas ref={canvasRef} />
      </div>

      <div className="tip">
        Pull back like a slingshot — the farther you drag, the harder the throw. Expert mode makes the
        mug a moving target.
      </div>

      {screen === 'menu' && (
        <Menu
          hard={hard}
          target={target}
          onHard={setHard}
          onTarget={setTarget}
          onStart={() => startRun(target, hard)}
          onLeaderboard={() => setLeaderOpen(true)}
        />
      )}

      {screen === 'end' && endInfo && (
        <EndScreen
          result={endInfo}
          onPlayAgain={() => startRun(endInfo.target, endInfo.hard)}
          onMainMenu={() => setScreen('menu')}
          onScoresChanged={() => setScoresVersion((v) => v + 1)}
        />
      )}

      {leaderOpen && <Leaderboard onBack={() => setLeaderOpen(false)} />}
      {confirmOpen && <ConfirmDialog onStay={confirmStay} onLeave={confirmLeave} />}
    </div>
  );
}
