import React, { useState, useEffect } from 'react';

// Custom simple components to replace UI library
const Button = ({ children, onClick, disabled, className }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`game-button ${className || ''}`}
  >
    {children}
  </button>
);

// Icon replacements using emoji
const Coins = () => <span className="icon">💰</span>;
const RefreshCw = () => <span className="icon">🔄</span>;
const Trophy = () => <span className="icon">🏆</span>;
const Zap = () => <span className="icon">⚡</span>;
const AlertTriangle = () => <span className="icon">⚠️</span>;
const Info = () => <span className="icon">ℹ️</span>;
const Star = () => <span className="icon">⭐</span>;

const LEVELS = [
  { 
    name: 'Rookie', 
    decks: 1, 
    minBet: 10, 
    dealerAggressiveness: 0,
    targetWins: 3,
    tips: [
      "Start with small bets to learn the game",
      "Always hit on 11 or below",
      "Stand on 17 and above"
    ]
  },
  { 
    name: 'Amateur', 
    decks: 2, 
    minBet: 25, 
    dealerAggressiveness: 0.2,
    targetWins: 4,
    tips: [
      "Consider doubling your bet after wins",
      "Watch the dealer's upcard",
      "Stand on hard 16 against dealer's 6 or lower"
    ]
  },
  { 
    name: 'Pro', 
    decks: 4, 
    minBet: 50, 
    dealerAggressiveness: 0.4,
    targetWins: 5,
    tips: [
      "Multiple decks make card counting harder",
      "Dealer gets more aggressive",
      "Manage your bankroll carefully"
    ]
  },
  { 
    name: 'Expert', 
    decks: 6, 
    minBet: 100, 
    dealerAggressiveness: 0.6,
    targetWins: 6,
    tips: [
      "Watch out for dealer's aggressive play",
      "Higher minimum bets require strategy",
      "Consider surrender on hard 16 vs 10"
    ]
  },
  { 
    name: 'Master', 
    decks: 8, 
    minBet: 200, 
    dealerAggressiveness: 0.8,
    targetWins: 7,
    tips: [
      "Maximum difficulty achieved",
      "Dealer plays optimally",
      "Risk management is crucial"
    ]
  }
];

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const BlackjackGame = () => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting');
  const [message, setMessage] = useState('Place your bet!');
  const [playerBalance, setPlayerBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [gamesWonAtLevel, setGamesWonAtLevel] = useState(0);
  const [achievements, setAchievements] = useState([]);

  // Achievement handling
  const checkAchievements = (balance, streak) => {
    const newAchievements = [];
    if (balance >= 2000 && !achievements.includes('High Roller')) {
      newAchievements.push('High Roller');
    }
    if (streak >= 5 && !achievements.includes('Hot Streak')) {
      newAchievements.push('Hot Streak');
    }
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setShowWarning(true);
      setMessage(`Achievement unlocked: ${newAchievements.join(', ')}!`);
    }
  };

  // Initialize deck with multiple decks based on level
  const initializeDeck = () => {
    const numberOfDecks = LEVELS[currentLevel].decks;
    const newDeck = [];
    for (let d = 0; d < numberOfDecks; d++) {
      for (const suit of SUITS) {
        for (const value of VALUES) {
          newDeck.push({ suit, value });
        }
      }
    }
    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (card.value === 'A') {
        aces += 1;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    for (let i = 0; i < aces; i++) {
      if (value + 11 <= 21) {
        value += 11;
      } else {
        value += 1;
      }
    }
    
    return value;
  };

  const startNewGame = () => {
    const newDeck = initializeDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop()];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('Your turn! Hit or Stand?');
    setShowWarning(false);
  };

  const placeBet = () => {
    const minBet = LEVELS[currentLevel].minBet;
    if (betAmount < minBet) {
      setMessage(`Minimum bet at this level is ${minBet}!`);
      setBetAmount(minBet);
      return;
    }
    if (betAmount > playerBalance) {
      setMessage("You don't have enough chips!");
      return;
    }
    setPlayerBalance(prev => prev - betAmount);
    setCurrentBet(betAmount);
    startNewGame();
  };

  const hit = () => {
    const newCard = deck.pop();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]); // Create new array reference to trigger renders
    
    const value = calculateHandValue(newHand);
    if (value > 21) {
      endGame('bust');
    }
  };

  const dealerShouldHit = (handValue) => {
    const { dealerAggressiveness } = LEVELS[currentLevel];
    // Basic strategy: hit on 16 or less
    if (handValue < 17) return true;
    // Advanced strategy based on level: sometimes hit on soft 17-18
    if (handValue <= 18 && Math.random() < dealerAggressiveness) return true;
    return false;
  };

  const dealerPlay = () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    while (dealerShouldHit(calculateHandValue(currentDealerHand))) {
      const newCard = currentDeck.pop();
      currentDealerHand.push(newCard);
    }
    
    setDealerHand(currentDealerHand);
    setDeck(currentDeck);
    setGameState('gameOver');
    
    const dealerValue = calculateHandValue(currentDealerHand);
    const playerValue = calculateHandValue(playerHand);
    
    if (dealerValue > 21) {
      endGame('dealerBust');
    } else if (dealerValue > playerValue) {
      endGame('dealerWin');
    } else if (dealerValue < playerValue) {
      endGame('playerWin');
    } else {
      endGame('push');
    }
  };

  const stand = () => {
    setGameState('dealerPlaying');
    dealerPlay();
  };

  const endGame = (result) => {
    setGameState('gameOver');
    switch (result) {
      case 'bust':
        setMessage('Bust! You lose!');
        setWinStreak(0);
        setGamesWonAtLevel(prev => Math.max(0, prev - 1));
        break;
      case 'dealerBust':
      case 'playerWin':
        const newWinStreak = winStreak + 1;
        const newGamesWonAtLevel = gamesWonAtLevel + 1;
        setWinStreak(newWinStreak);
        setGamesWonAtLevel(newGamesWonAtLevel);
        setPlayerBalance(prev => prev + currentBet * 2);
        setMessage(`You win! (${newGamesWonAtLevel}/${LEVELS[currentLevel].targetWins} wins at this level)`);
        checkAchievements(playerBalance + currentBet * 2, newWinStreak);
        
        // Check for level up
        if (newGamesWonAtLevel >= LEVELS[currentLevel].targetWins && currentLevel < LEVELS.length - 1) {
          setCurrentLevel(prev => prev + 1);
          setGamesWonAtLevel(0);
          setShowWarning(true);
          setMessage('Congratulations! Level Up!');
        }
        break;
      case 'dealerWin':
        setMessage('Dealer wins!');
        setWinStreak(0);
        setGamesWonAtLevel(prev => Math.max(0, prev - 1));
        break;
      case 'push':
        setMessage('Push! Bet returned.');
        setPlayerBalance(prev => prev + currentBet);
        break;
      default:
        break;
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setCurrentBet(0);
    setMessage('Place your bet!');
    setShowWarning(false);
  };

  const getCardColor = (suit) => {
    return ['♥', '♦'].includes(suit) ? 'red' : 'black';
  };

  return (
    <div className="game-container">
      {/* Level Progress Bar */}
      <div className="progress-container">
        <div className="progress-header">
          <span>Level Progress</span>
          <span>{gamesWonAtLevel}/{LEVELS[currentLevel].targetWins}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(gamesWonAtLevel / LEVELS[currentLevel].targetWins) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-group">
          <div className="stat-item">
            <Coins /> 
            <span className="stat-value">{playerBalance}</span>
          </div>
          <div className="stat-item">
            <Trophy />
            <span className="stat-value">{winStreak}</span>
          </div>
        </div>
        <div className="stat-item">
          <Zap />
          <span className="stat-value">{LEVELS[currentLevel].name}</span>
        </div>
        <Button 
          onClick={resetGame}
          className="secondary"
        >
          <RefreshCw /> New Game
        </Button>
      </div>

      {/* Tips Section */}
      {showTip && (
        <div className="tips-container">
          <div className="tips-header">
            <div className="tips-title">
              <Info />
              <h4>Level Tips:</h4>
            </div>
            <Button onClick={() => setShowTip(false)} className="small">
              Hide Tips
            </Button>
          </div>
          <ul className="tips-list">
            {LEVELS[currentLevel].tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="achievements">
          {achievements.map((achievement, index) => (
            <div key={index} className="achievement-badge">
              <Star />
              <span>{achievement}</span>
            </div>
          ))}
        </div>
      )}

      {/* Level Up Warning */}
      {showWarning && (
        <div className="warning">
          <AlertTriangle />
          <div>
            <p className="warning-title">Level Up to {LEVELS[currentLevel].name}!</p>
            <p className="warning-desc">
              New challenges: {LEVELS[currentLevel].decks} decks, 
              min bet ${LEVELS[currentLevel].minBet}, 
              smarter dealer
            </p>
          </div>
        </div>
      )}

      <div className="game-area">
        {/* Dealer's Hand */}
        <div className="hand-area">
          <h3 className="hand-title">Dealer's Hand ({gameState !== 'gameOver' && dealerHand.length === 1 ? '?' : calculateHandValue(dealerHand)})</h3>
          <div className="cards-container">
            {dealerHand.map((card, index) => (
              <div 
                key={index} 
                className={`card ${getCardColor(card.suit)}`}
              >
                {card.value}{card.suit}
              </div>
            ))}
          </div>
        </div>

        {/* Player's Hand */}
        <div className="hand-area">
          <h3 className="hand-title">Your Hand ({calculateHandValue(playerHand)})</h3>
          <div className="cards-container">
            {playerHand.map((card, index) => (
              <div 
                key={index} 
                className={`card ${getCardColor(card.suit)}`}
              >
                {card.value}{card.suit}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="game-controls">
        <div className="message">{message}</div>
        
        {gameState === 'betting' && (
          <div className="betting-controls">
            <Button 
              onClick={() => setBetAmount(prev => Math.max(LEVELS[currentLevel].minBet, prev - LEVELS[currentLevel].minBet))}
              className="secondary"
            >
              -{LEVELS[currentLevel].minBet}
            </Button>
            <div className="bet-display">
              <Coins />
              <span>{betAmount}</span>
            </div>
            <Button 
              onClick={() => setBetAmount(prev => Math.min(playerBalance, prev + LEVELS[currentLevel].minBet))}
              className="secondary"
            >
              +{LEVELS[currentLevel].minBet}
            </Button>
            <Button 
              onClick={placeBet}
              className="primary"
            >
              Place Bet
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="action-controls">
            <Button onClick={hit} className="primary">Hit</Button>
            <Button onClick={stand} className="primary">Stand</Button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="action-controls">
            <Button onClick={resetGame} className="primary">Play Again</Button>
          </div>
        )}
      </div>

      {/* Show/Hide Tips Button */}
      {!showTip && (
        <Button 
          onClick={() => setShowTip(true)}
          className="info-button"
        >
          <Info /> Show Tips
        </Button>
      )}
    </div>
  );
};

export default BlackjackGame;