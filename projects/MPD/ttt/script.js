const cells = document.querySelectorAll('[data-cell]');
const winnerMessage = document.getElementById('winner-message');
const restartButton = document.getElementById('restart-button');

let currentPlayer = 'X';
let gameActive = true;
const board = Array(9).fill(null);

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function handleCellClick(e) {
    const cell = e.target;
    const cellIndex = Array.from(cells).indexOf(cell);

    if (board[cellIndex] || !gameActive) return;

    if (currentPlayer === 'X') {
        cell.style.color = 'darkred';
    } else {
        cell.style.color = 'darkblue';
    }

    board[cellIndex] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add('taken');

    if (checkWin(currentPlayer)) {
        endGame(`${currentPlayer} wins!`);
    } else if (board.every(cell => cell)) {
        endGame("It's a draw!");
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }
}

function checkWin(player) {
    return winningCombinations.some(combination => combination.every(index => board[index] === player));
}

function endGame(message) {
    gameActive = false;
    winnerMessage.textContent = message;

    if (message === "It's a draw!") {
        cells.forEach(cell => {
            cell.style.color = 'purple';
        });
    }
}

function restartGame() {
    gameActive = true;
    currentPlayer = 'X';
    board.fill(null);
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken');
    });
    winnerMessage.textContent = '';
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartButton.addEventListener('click', restartGame);