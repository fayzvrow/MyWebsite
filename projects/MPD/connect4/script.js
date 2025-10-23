const cells = document.querySelectorAll('[data-cell]');
const playerName = document.getElementById("player-name");
const playerCircle = document.getElementById("player-circle");
const winnerMessage = document.getElementById("winner-message");
const restartButton = document.getElementById("restart-button");
const turnIndicator = document.getElementById("turn-indicator");

currentPlayer = 'Red';
gameActive = true;
const board = Array(42).fill(null);

const winningCombinations = [
    [0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6],
    [7, 8, 9, 10], [8, 9, 10, 11], [9, 10, 11, 12], [10, 11, 12, 13],
    [14, 15, 16, 17], [15, 16, 17, 18], [16, 17, 18, 19], [17, 18, 19, 20],
    [21, 22, 23, 24], [22, 23, 24, 25], [23, 24, 25, 26], [24, 25, 26, 27],
    [28, 29, 30, 31], [29, 30, 31, 32], [30, 31, 32, 33], [31, 32, 33, 34],
    [35, 36, 37, 38], [36, 37, 38, 39], [37, 38, 39, 40], [38, 39, 40, 41],

    [0, 7, 14, 21], [7, 14, 21, 28], [14, 21, 28, 35],
    [1, 8, 15, 22], [8, 15, 22, 29], [15, 22, 29, 36],
    [2, 9, 16, 23], [9, 16, 23, 30], [16, 23, 30, 37],
    [3, 10, 17, 24], [10, 17, 24, 31], [17, 24, 31, 38],
    [4, 11, 18, 25], [11, 18, 25, 32], [18, 25, 32, 39],
    [5, 12, 19, 26], [12, 19, 26, 33], [19, 26, 33, 40],
    [6, 13, 20, 27], [13, 20, 27, 34], [20, 27, 34, 41],

    [0, 8, 16, 24], [8, 16, 24, 32], [16, 24, 32, 40],
    [1, 9, 17, 25], [9, 17, 25, 33], [17, 25, 33, 41],
    [2, 10, 18, 26], [10, 18, 26, 34], [3, 11, 19, 27],
    [7, 15, 23, 31], [15, 23, 31, 39], [14, 22, 30, 38],
]

function handleCellClick(e) {
    const cell = e.target;
    const cellIndex = Array.from(cells).indexOf(cell);
    const column = cellIndex % 7;

    let row = -1;
    for (let r = 5; r >= 0; r--) {
        if (!board[r * 7 + column]) {
            row = r;
            break;
        }
    }

    if (row === -1 || !gameActive) return;

    const newIndex = row * 7 + column;

    board[newIndex] = currentPlayer;
    cells[newIndex].classList.add('taken', currentPlayer.toLowerCase());

    if (checkWin(currentPlayer)) {
        endGame(currentPlayer);
    } else if (board.every(cell => cell)) {
        endGame(null);
    } else {
        currentPlayer = currentPlayer === 'Red' ? 'Yellow' : 'Red';
        turnIndicator.innerHTML = `Your Move: <span class="${currentPlayer.toLowerCase()}-text">${currentPlayer}</span>`;
        playerName.textContent = currentPlayer;

        playerCircle.classList.remove("red", "yellow");
        playerCircle.classList.add(currentPlayer.toLowerCase());
    }
}

function checkWin(player) {
    return winningCombinations.some(combination => combination.every(index => board[index] === player));
}

function endGame(winner) {
    gameActive = false;
    if (winner === "Red") {
        winnerMessage.innerHTML = `<span class="red-text">Red</span> wins! Play Again?`;
        winnerMessage.classList.add("win");
    } else if (winner === "Yellow") {
        winnerMessage.innerHTML = `<span class="yellow-text">Yellow</span> wins! Play Again?`;
        winnerMessage.classList.add("win");
    } else {
        winnerMessage.textContent = "It's a draw!";
        winnerMessage.classList.remove("win");
    }
    turnIndicator.textContent = "Game Over!";
}

function restartGame() {
    currentPlayer = 'Red';
    gameActive = true;
    board.fill(null);
    cells.forEach(cell => {
        cell.classList.remove('taken', 'red', 'yellow');
    });
    winnerMessage.textContent = "Drop discs, connect four, win!";
    winnerMessage.classList.remove("win");
    turnIndicator.innerHTML = `Your Move: <span class="red-text">Red</span>`;
    playerName.textContent = "Red";
    playerCircle.classList.remove("red", "yellow");
    playerCircle.classList.add("red");
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartButton.addEventListener('click', restartGame);