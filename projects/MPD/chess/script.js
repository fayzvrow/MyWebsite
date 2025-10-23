const cells = document.querySelectorAll("[data-cell]");

let board = Array(8).fill(null).map(() => Array(8).fill(null));
let seconds = 0, minutes = 0, interval = null, running = false;
let firstMoveMade = false, firstMoveTriggered = false;

function setupChessBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let c = 0; c < 8; c++) {
        board[1][c] = { piece: 'pawn', color: 'black', hasMoved: false };
        board[6][c] = { piece: 'pawn', color: 'white', hasMoved: false };
    }

    const back = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
    for (let c = 0; c < 8; c++) {
        board[0][c] = { piece: back[c], color: 'black', hasMoved: false };
        board[7][c] = { piece: back[c], color: 'white', hasMoved: false };
    }
}

function paintBoard() {
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;

        cell.setAttribute("data-row", row);
        cell.setAttribute("data-col", col);
        cell.classList.remove("white-piece", "black-piece", "selected", "highlight-move", "highlight-capture");
        cell.classList.add((row + col) % 2 === 0 ? "light-square" : "dark-square");

        const piece = board[row][col];
        cell.innerHTML = piece ? pieceSymbols[piece.color][piece.piece] : "";
        if (piece) cell.classList.add(piece.color + "-piece");
    });
    updateTurnIndicator();
}

const pieceSymbols = {
    white: { pawn: '&#9823;', rook: '&#9820;', knight: '&#9822;', bishop: '&#9821;', queen: '&#9819;', king: '&#9818;' },
    black: { pawn: '&#9823;', rook: '&#9820;', knight: '&#9822;', bishop: '&#9821;', queen: '&#9819;', king: '&#9818;' } 
};

const turnIndicator = document.getElementById("turn-indicator");

let currentPlayer = 'white';
let selectedCell = null;
let moveHistory = [];
let enPassantTarget = null;
let gameActive = true;

function updateTurnIndicator(selectedPieceType = 'pawn') {
    const turnElement = document.getElementById("current-turn");

    const pieceSymbol = pieceSymbols[currentPlayer][selectedPieceType];
    const playerName = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);

    turnElement.innerHTML = `<span class="${currentPlayer}-text">${playerName}</span> <span class="${currentPlayer}-piece">${pieceSymbol}</span>`;
}

setupChessBoard();
paintBoard();

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    updateTurnIndicator();
}
updateTurnIndicator();

function isInBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isEnemy(row, col, color) {
    return isInBounds(row, col) && board[row][col] && board[row][col].color !== color;
}

function isEmpty(row, col) {
    return isInBounds(row, col) && !board[row][col];
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    if (!isInBounds(toRow, toCol)) return false;

    const movingPiece = board[fromRow][fromCol];
    if (!movingPiece) return false;

    const target = board[toRow][toCol];
    let capturedPiece = target ? { ...target } : null;

    if (movingPiece.piece === 'pawn' && enPassantTarget && 
        toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
            const capturedRow = (movingPiece.color === 'white') ? toRow + 1 : toRow - 1;
            capturedPiece = board[capturedRow][toCol] ? { ...board[capturedRow][toCol] } : null;
            board[capturedRow][toCol] = null;
    }

    board[toRow][toCol] = movingPiece;
    board[fromRow][fromCol] = null;

    const wasDoublePush = (movingPiece.piece === 'pawn' && Math.abs(toRow - fromRow) === 2);
    const oldEnPassant = enPassantTarget;
    enPassantTarget = wasDoublePush ? { row: (fromRow + toRow) / 2, col: fromCol } : null;

    let castle = null;
    if (movingPiece.piece === 'king' && Math.abs(toCol - fromCol) === 2) {
        const rookFromCol = toCol > fromCol ? 7 : 0;
        const rookToCol = toCol > fromCol ? toCol - 1 : toCol + 1;
        const row = fromRow;

        const rook = board[row][rookFromCol];
        const rookStateBefore = { ...rook };
        board[row][rookToCol] = rook;
        board[row][rookFromCol] = null;
        rook.hasMoved = true;

        castle = { rookFromCol, rookToCol, rookState: rookStateBefore };
    }

    let promotion = false;
    if (movingPiece.piece === 'pawn' && ((movingPiece.color === 'white' && toRow === 0) || (movingPiece.color === 'black' && toRow === 7))) {    
        promotion = true;
        showPromotionMenu(movingPiece.color, toRow, toCol);
    }

    moveHistory.push({
        fromRow,
        fromCol,
        toRow,
        toCol,
        movedPiece: JSON.parse(JSON.stringify(movingPiece)),
        capturedPiece,
        promotion,
        castle,
        enPassantTarget: oldEnPassant
    });

    movingPiece.hasMoved = true;

    document.querySelectorAll(".last-move").forEach(c => c.classList.remove("last-move"));
    const fromCell = document.querySelector(`[data-row='${fromRow}'][data-col='${fromCol}']`);
    const toCell = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
    if (fromCell) fromCell.classList.add("last-move");
    if (toCell) toCell.classList.add("last-move");

    if (!firstMoveTriggered && movingPiece.color === 'white') {
        firstMoveTriggered = true;
        firstMoveMade = true;
        startStopwatch();
        pauseButton.innerHTML = 'Pause Timer &#9208;';
    }

    paintBoard();
    switchTurn();
    updateTurnIndicator('pawn');
    checkGameState();
    return true;
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const direction = piece.color === 'white' ? -1 : 1;

    if (fromCol === toCol && toRow === fromRow + direction && isEmpty(toRow, toCol)) {
            return true;
    }

    if (!piece.hasMoved && fromCol === toCol && toRow === fromRow + 2 * direction && isEmpty(fromRow + direction, fromCol) && isEmpty(toRow, toCol)) {
        return true;
    }

    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
        if (isEnemy(toRow, toCol, piece.color)) {
            return true;
        }

        if (enPassantTarget && enPassantTarget.row === toRow && enPassantTarget.col === toCol && isEmpty(toRow, toCol)) {
            return true;
        }
    }

    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) {
        return false;
    }

    const rowIncrement = fromRow === toRow ? 0 : fromRow < toRow ? 1 : -1;
    const colIncrement = fromCol === toCol ? 0 : fromCol < toCol ? 1 : -1;

    let row = fromRow + rowIncrement;
    let col = fromCol + colIncrement;

    while (row !== toRow || col !== toCol) {
        if (!isEmpty(row, col)) {
            return false;
        }
        row += rowIncrement;
        col += colIncrement;
    }

    return true;
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);

    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) {
        return false;
    }

    const rowIncrement = fromRow < toRow ? 1 : -1;
    const colIncrement = fromCol < toCol ? 1 : -1;

    let row = fromRow + rowIncrement;
    let col = fromCol + colIncrement;

    while (row !== toRow || col !== toCol) {
        if (!isEmpty(row, col)) {
            return false;
        }
        row += rowIncrement;
        col += colIncrement;
    }

    return true;
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isSquareAttacked(row, col, attackerColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece || piece.color !== attackerColor) continue;

            let isAttacking = false;

            if (piece.piece === "pawn") {
                const direction = piece.color === "white" ? -1 : 1;
                if (r + direction === row && (c + 1 === col || c - 1 === col)) {
                    isAttacking = true;
                }
            } else if (piece.piece === "rook") {
                isAttacking = isValidRookMove(r, c, row, col);
            } else if (piece.piece === "knight") {
                isAttacking = isValidKnightMove(r, c, row, col);
            } else if (piece.piece === "bishop") {
                isAttacking = isValidBishopMove(r, c, row, col);
            } else if (piece.piece === "queen") {
                isAttacking = isValidQueenMove(r, c, row, col);
            } else if (piece.piece === "king") {
                if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
                    isAttacking = true;
                }
            }

            if (isAttacking) return true;
        }
    }
    return false;
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const king = board[fromRow][fromCol];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
        return true;
    }

    if (!king.hasMoved && rowDiff === 0 && Math.abs(colDiff) === 2) {
        const rookCol = colDiff > 0 ? 7 : 0;
        const rook = board[fromRow][rookCol];
        if (!rook || rook.piece !== 'rook' || rook.color !== king.color || rook.hasMoved) {
            return false;
        }

        const step = colDiff > 0 ? 1 : -1;
        for (let c = fromCol + step; c !== rookCol; c += step) {
            if (board[fromRow][c]) return false;
        }

        const enemy = king.color === "white" ? "black" : "white";
        for (let c = fromCol; c !== fromCol + step * 3; c += step) {
            if (Math.abs(c - fromCol) <= 2) {
                if (isSquareAttacked(fromRow, c, enemy)) {
                    return false;
                }
            }
        }

        return true;
    }

    return false;
}

function showPromotionMenu(color, row, col) {
    const menu = document.getElementById("promotion-menu");
    const buttons = menu.querySelectorAll("button");

    const promotionChoices = ["queen", "rook", "bishop", "knight"];

    buttons.forEach((btn, i) => {
        const piece = promotionChoices[i];
        btn.innerHTML = pieceSymbols[color][piece];
        btn.onclick = () => {
            board[row][col] = { piece, color, hasMoved: true };
            paintBoard();
            menu.style.display = "none";
        };
    });

    menu.style.display = "block";
    menu.style.left = "50%";
    menu.style.top = "50%";
    menu.style.transform = "translate(-50%, -50%)";
}

let highlightCells = [];

function clearHighlights() {
    highlightCells.forEach(cell => {
        cell.classList.remove("highlight-move", "highlight-capture");
    });
    highlightCells = [];
}

function highlightMoves(row, col) {
    clearHighlights();

    const piece = board[row][col];
    if (!piece) return;

    let moves = getValidMoves(row, col, piece);

    moves.forEach(([toRow, toCol]) => {
        const targetCell = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);

        let isCapture = false;

        if (board[toRow][toCol] !== null && board[toRow][toCol].color !== piece.color) {
            isCapture = true;
        }

        if (piece.piece === "pawn" && board[toRow][toCol] === null && col !== toCol && enPassantTarget && enPassantTarget.row === toRow && enPassantTarget.col === toCol) {
            isCapture = true;
        }

        if (isCapture) {
            targetCell.classList.add("highlight-capture");
        } else {
            targetCell.classList.add("highlight-move");
        }

        highlightCells.push(targetCell);
    });
}

function getValidMoves(fromRow, fromCol, piece) {
    let moves = [];

    for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
            if (fromRow === toRow && fromCol === toCol) continue;

            const target = board[toRow][toCol];
            if (target && target.color === piece.color) continue;

            let isValid = false;
            if (piece.piece === "pawn") {
                isValid = isValidPawnMove(fromRow, fromCol, toRow, toCol);
            } else if (piece.piece === "rook") {
                isValid = isValidRookMove(fromRow, fromCol, toRow, toCol);
            } else if (piece.piece === "knight") {
                isValid = isValidKnightMove(fromRow, fromCol, toRow, toCol);
            } else if (piece.piece === "bishop") {
                isValid = isValidBishopMove(fromRow, fromCol, toRow, toCol);
            } else if (piece.piece === "queen") {
                isValid = isValidQueenMove(fromRow, fromCol, toRow, toCol);
            } else if (piece.piece === "king") {
                isValid = isValidKingMove(fromRow, fromCol, toRow, toCol);
            }

            if (isValid) {
                const backupFrom = board[fromRow][fromCol];
                const backupTo = board[toRow][toCol];

                board[toRow][toCol] = backupFrom;
                board[fromRow][fromCol] = null;

                const stillInCheck = isInCheck(piece.color);

                board[fromRow][fromCol] = backupFrom;
                board[toRow][toCol] = backupTo;

                if (!stillInCheck) {
                    moves.push([toRow, toCol]);
                }
            }
        }
    }
    return moves;
}

function findKing(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.piece === "king" && piece.color === color) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

function isInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;
    const enemy = color === "white" ? "black" : "white";
    return isSquareAttacked(kingPos.row, kingPos.col, enemy);
}

function hasAnyValidMoves(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece || piece.color !== color) continue;
            const moves = getValidMoves(r, c, piece);

            for (let [toRow, toCol] of moves) {
                const backup = board[toRow][toCol];
                const movingPiece = board[r][c];
                board[toRow][toCol] = movingPiece;
                board[r][c] = null;

                const inCheck = isInCheck(color);

                board[r][c] = movingPiece;
                board[toRow][toCol] = backup;

                if(!inCheck) return true;
            }
        }
    }
    return false;
}

function hasInsufficientMaterial() {
    let pieces = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                pieces.push(piece);
            }
        }
    }

    if (pieces.length === 2 && pieces.every(p => p.piece === "king")) {
        return true;
    }

    if (pieces.length === 3) {
        return pieces.filter(p => p.piece !== "king").every(p => p.piece === "bishop" || p.piece === "knight");
    }

    if (pieces.length === 4) {
        const nonKings = pieces.filter(p => p.piece !== "king");
        if (nonKings.length === 2 && nonKings.every(p => p.piece === "bishop")) {
            return true;
        }
    }

    return false;
}

const messageBox = document.getElementById("message-box");
const infoPanel = document.getElementById("info-panel");

function checkGameState() {
    if (!gameActive) return;

    if (hasInsufficientMaterial()) {
        gameActive = false;
        showWinner(null, "Draw by insufficient material");
        return;
    }

    if (isInCheck(currentPlayer)) {
        if (!hasAnyValidMoves(currentPlayer)) {
            gameActive = false;
            showWinner(currentPlayer === "white" ? "Black" : "White", "Checkmate");
        } else {
            messageBox.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`;
            messageBox.style.color = "#A41603";
            messageBox.style.display = "block";
            infoPanel.style.boxShadow = "2px 2px 8px #A41603";
        }
    } else {
        if (!hasAnyValidMoves(currentPlayer)) {
            gameActive = false;
            showWinner(null, "Stalemate");
        } else {
            messageBox.textContent = "Move, play smart, checkmate, win!";
            messageBox.style.color = "#000";
            messageBox.style.display = "block";
            infoPanel.style.boxShadow = "2px 2px 8px gray";
        }
    }
}

function showWinner(winner, reason) {
    if (winner) {
        messageBox.textContent = `${reason}! ${winner} wins the game!`;
        messageBox.style.color = 'green';
    } else {
        messageBox.textContent = `${reason}! It's a draw`;
    }
    messageBox.style.display = "block";
    pauseStopwatch();
}

const undoButton = document.getElementById("undo-button");
undoButton.addEventListener("click", () => {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    const { fromRow, fromCol, toRow, toCol, movedPiece, capturedPiece, promotion, castle, enPassantTarget: oldEnPassant } = lastMove;

    if (promotion) {
        board[fromRow][fromCol] = { piece: 'pawn', color: movedPiece.color, hasMoved: true };
    } else {
        board[fromRow][fromCol] = { ...movedPiece };
    }


    board[toRow][toCol] = capturedPiece ? { ...capturedPiece } : null;

    if (castle) {
        const { rookFromCol, rookToCol, rookState } = castle;
        board[fromRow][rookFromCol] = { ...rookState };
        board[fromRow][rookToCol] = null;
    }

    enPassantTarget = oldEnPassant || null;

    clearHighlights();
    selectedCell = null;
    document.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
    document.querySelectorAll(".last-move").forEach(c => c.classList.remove("last-move"));


    paintBoard();
    currentPlayer = currentPlayer === "white" ? "black" : "white";
    updateTurnIndicator();
    gameActive = true;
    checkGameState();
});

const restartButton = document.getElementById("restart-button");
restartButton.addEventListener("click", () => {
    setupChessBoard();
    paintBoard();
    currentPlayer = 'white';
    moveHistory = [];
    enPassantTarget = null;
    gameActive = true;
    updateTurnIndicator();
    firstMoveTriggered = false;
    document.querySelectorAll(".last-move").forEach(c => c.classList.remove("last-move"));

    messageBox.textContent = "Move, play smart, checkmate, win!";
    messageBox.style.color = "#000";
    messageBox.style.display = "block";
    infoPanel.style.boxShadow = "2px 2px 8px gray";
    resetStopwatch();
});

cells.forEach((cell, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    cell.addEventListener("click", () => {
        if (!gameActive) return;

        const clickedPiece = board[row][col];

        if (!selectedCell) {
            if (clickedPiece && clickedPiece.color === currentPlayer) {
                const moves = getValidMoves(row, col, clickedPiece);
                if (moves.length > 0) {
                    selectedCell = { row, col };
                    cell.classList.add("selected");
                    highlightMoves(row, col);

                    updateTurnIndicator(clickedPiece.piece);
                }
            }
            return;
        }

        const fromRow = selectedCell.row;
        const fromCol = selectedCell.col;
        const piece = board[fromRow][fromCol];

        const moves = getValidMoves(fromRow, fromCol, piece);
        let validMove = moves.some(([toRow, toCol]) => toRow === row && toCol === col);

        if (validMove) {
            movePiece(fromRow, fromCol, row, col);
        }
        clearHighlights();

        document.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
        selectedCell = null;
    });
});

const stopwatchE1 = document.getElementById("stopwatch");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");

function updateStopwatch() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
    }

    let displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    let displaySeconds = seconds < 10 ? '0' + seconds : seconds;

    stopwatchE1.textContent = displayMinutes + ':' + displaySeconds;
}

function startStopwatch() {
    if (!running) {
        interval = setInterval(updateStopwatch, 1000);
        running = true;
    }
}

function pauseStopwatch() {
    clearInterval(interval);
    running = false;
    pauseButton.innerHTML = 'Resume Timer &#9654;';
}

function resetStopwatch() {
    pauseStopwatch();
    seconds = 0;
    minutes = 0;
    stopwatchE1.textContent = "00:00";
    pauseButton.innerHTML = 'Play Timer &#9654;';
}

pauseButton.addEventListener("click", () => {
    if (!firstMoveMade) return;

    if (running) {
        pauseStopwatch();
        pauseButton.innerHTML = 'Resume Timer &#9654;';
    } else {
        startStopwatch();
        pauseButton.innerHTML = 'Pause Timer &#9208;';
    }
});

resetButton.addEventListener("click", resetStopwatch);