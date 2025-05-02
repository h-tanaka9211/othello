// 共通の方向定義を定数化
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// プレイヤーの色を切り替える関数
function getOpponentColor(color) {
    return color === 'black' ? 'white' : 'black';
}

// セレクタを定数としてまとめる
const SELECTORS = {
    board: '.board',
    colorSelection: '.color-selection',
    difficultySelection: '.difficulty-selection',
    gameResult: '.game-result',
    resultText: '.result-text',
    restartBtn: '.restart-btn',
    resetBtn: '.reset-btn',
    testBtn: '.test-btn',
    viewFinalBoard: '.view-final-board',
    testPatterns: '.test-patterns',
    tempMessage: '.temp-message',
    tempMessageText: '.temp-message-text',
    playerInfo: '.player-info',
    playerIcon: '.player-icon',
    playerLabel: '.player-label',
    playerCount: '.player-count',
    cpuLabel: '.cpu-label',
    cpuCount: '.cpu-count',
    cpuIcon: '.cpu-icon',
    colorBtn: '.color-btn',
    difficultyBtn: '.difficulty-btn',
    toggleSecretBtn: '.toggle-secret-btn',
    levelOniBtn: '.level-oni'
};

// DOMアクセスをquerySelectorに統一
class OthelloGame {
    constructor() {
        console.log('オセロゲームを開始します');
        this.board = document.querySelector(SELECTORS.board);
        this.colorSelection = document.querySelector(SELECTORS.colorSelection);
        this.difficultySelection = document.querySelector(SELECTORS.difficultySelection);
        this.gameResult = document.querySelector(SELECTORS.gameResult);
        this.resultText = document.querySelector(SELECTORS.resultText);
        this.restartBtn = document.querySelector(SELECTORS.restartBtn);
        this.resetBtn = document.querySelector(SELECTORS.resetBtn);
        this.viewFinalBoard = document.querySelector(SELECTORS.viewFinalBoard);
        this.testPatterns = document.querySelector(SELECTORS.testPatterns);
        this.tempMessage = document.querySelector(SELECTORS.tempMessage);
        this.tempMessageText = document.querySelector(SELECTORS.tempMessageText);
        this.playerInfo = document.querySelector(SELECTORS.playerInfo);
        this.playerIcon = document.querySelector(SELECTORS.playerIcon);
        this.playerLabel = document.querySelector(SELECTORS.playerLabel);
        this.playerCount = document.querySelector(SELECTORS.playerCount);
        this.cpuLabel = document.querySelector(SELECTORS.cpuLabel);
        this.cpuCount = document.querySelector(SELECTORS.cpuCount);
        this.cpuIcon = document.querySelector(SELECTORS.cpuIcon);

        this.isTestPatternsVisible = false;
        this.highlightPulseTimeout = null; // タイマー制御用変数を追加

        this.gameState = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.playerColor = null;
        this.cpuColor = null;
        this.isPlayerTurn = true;
        this.gameOver = false;

        this.initializeBoard();
        this.initializeColorSelection();
        this.initializeDifficultySelection();
        this.restartBtn.addEventListener('click', () => this.resetGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.viewFinalBoard.addEventListener('click', () => this.toggleFinalBoard());

        // テストパターンのイベントリスナーを更新
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'k' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                this.isTestPatternsVisible = !this.isTestPatternsVisible;
                this.testPatterns.style.display = this.isTestPatternsVisible ? 'flex' : 'none';
                console.log('テストパターン表示:', this.isTestPatternsVisible);

                // デバッグ用盤面をセットした際にCPUの難易度を初期化
                if (this.isTestPatternsVisible) {
                    this.cpuDifficulty = 1;
                    console.log('CPUの難易度を初期化しました: LEVEL 1');

                    // 難易度選択ダイアログを非表示にする
                    this.difficultySelection.style.display = 'none';
                }
            }
        });

        const testBtns = document.querySelectorAll(SELECTORS.testBtn);
        testBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const pattern = btn.dataset.pattern;
                this.loadTestPattern(pattern);
                this.testPatterns.style.display = 'none';
                this.isTestPatternsVisible = false;
            });
        });

        // 初期状態ではリセットボタンとテストパターンを非表示
        this.resetBtn.style.display = 'none';
        this.testPatterns.style.display = 'none';

        const toggleSecretBtn = document.querySelector(SELECTORS.toggleSecretBtn);
        const oniBtn = document.querySelector(SELECTORS.levelOniBtn);

        toggleSecretBtn.addEventListener('click', () => {
            const isVisible = oniBtn.style.display === 'block';
            oniBtn.style.display = isVisible ? 'none' : 'block';
        });
    }

    initializeBoard() {
        this.board.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                this.board.appendChild(cell);
            }
        }

        this.gameState[3][3] = 'white';
        this.gameState[3][4] = 'black';
        this.gameState[4][3] = 'black';
        this.gameState[4][4] = 'white';

        this.updateBoard();
    }

    initializeColorSelection() {
        const colorBtns = document.querySelectorAll(SELECTORS.colorBtn);
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isTestPatternsVisible) return;

                this.playerColor = btn.dataset.color;
                this.cpuColor = getOpponentColor(this.playerColor);
                this.colorSelection.style.display = 'none';
                this.openDifficultyDialog();
                this.difficultySelection.style.display = 'block';
                this.resetBtn.style.display = 'block';

                if (this.playerColor === 'random') {
                    this.playerColor = Math.random() < 0.5 ? 'black' : 'white';
                    this.cpuColor = getOpponentColor(this.playerColor);
                }
                this.updateInfo();
            });
        });
    }

    initializeDifficultySelection() {
        document.querySelectorAll(SELECTORS.difficultyBtn).forEach(button => {
            button.addEventListener('click', () => {
                this.cpuDifficulty = parseInt(button.dataset.level);
                this.difficultySelection.style.display = 'none';

                // CPUラベルの更新
                const cpuLabel = document.querySelector(SELECTORS.cpuLabel);

                if (cpuLabel) {
                    if (this.cpuDifficulty === 99) {
                        cpuLabel.textContent = `CPU LEVEL おに 👹`;
                    } else {
                        cpuLabel.textContent = `CPU LEVEL ${this.cpuDifficulty}`;
                    }
                    cpuLabel.classList.add('visible');

                    // プレイヤーの色に応じてラベルの色を変更
                    const playerColor = this.playerColor === 'black' ? 'black' : 'white';
                    cpuLabel.className = `visible ${playerColor}`;
                }

                // 選択した色を通知するメッセージを表示
                setTimeout(() => {
                    const colorInJapanese = this.playerColor === 'black' ? '黒色' : '白色';
                    this.tempMessage.classList.add('pass');
                    this.tempMessageText.innerHTML = `あなたの駒は<span class="color-box ${this.playerColor}">${colorInJapanese}</span>です`;
                    this.tempMessage.style.display = 'block';

                    // 1秒後にメッセージを非表示にして、ボードを活性化
                    setTimeout(() => {
                        this.tempMessage.style.display = 'none';
                        this.tempMessage.classList.remove('pass');
                        this.board.classList.add('active');

                        // プレイヤーが白の場合、CPUのターンから開始
                        if (this.playerColor === 'white') {
                            this.isPlayerTurn = false;
                            setTimeout(() => this.executeCpuTurn(), 500);
                        }
                    }, 1000);
                }, 500);
            });
        });
    }
    
    openDifficultyDialog() {
        // 鬼モード非表示（毎回適用）
        const oniBtn = document.querySelector(SELECTORS.levelOniBtn);
        if (oniBtn) {
            oniBtn.style.display = 'none';
        }

        // 難易度ボタンの選択状態をリセット
        document.querySelectorAll(SELECTORS.difficultyBtn).forEach(btn => {
            btn.classList.remove('selected');
        });

        // LEVEL 1 を選択状態にする
        const level1Btn = document.querySelector('.difficulty-btn[data-level="1"]');
        if (level1Btn) {
            level1Btn.classList.add('selected');
        }

        // ダイアログを表示
        this.difficultySelection.style.display = 'block';
    }

    handleCellClick(row, col) {
        if (!this.board.classList.contains('active')) {
            console.log('ゲームがまだ開始されていないため、駒を置けません');
            return;
        }

        if (this.tempMessage && this.tempMessage.style.display === 'block') {
            console.log('メッセージ表示中は操作できません');
            return;
        }

        if (this.isTestPatternsVisible) return; // テストパターン表示中は無効
        if (!this.isPlayerTurn || this.gameOver) {
            console.log('相手のターンです');
            return;
        }

        if (this.gameState[row][col] !== null) {
            console.log('すでに駒が置いてあります');
            return;
        }

        if (this.isValidMove(row, col)) {
            console.log('プレイヤーの手:', row, col);

            // プレイヤーが駒を置く
            if (this.placePiece(row, col)) {
                this.updateBoard();
                this.clearHighlights();
                this.calculateAndUpdatePieceCounts();
                // CPUのターンへ
                this.nextTurn();
            }
        } else {
            console.log('そこに駒は置けません');
        }
    }

    toggleFinalBoard() {
        if (this.isTestPatternsVisible) return; // テストパターン表示中は無効
        // 最終盤面を表示
        this.board.style.display = 'grid';
        this.gameResult.style.display = 'none';
        this.viewFinalBoard.style.display = 'none';
        this.resetBtn.style.display = 'block';
    }

    resetGame() {
        if (this.isTestPatternsVisible) return; // テストパターン表示中は無効
        this.gameState = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.initializeBoard();
        this.gameResult.style.display = 'none';
        this.board.style.display = 'grid';
        this.board.classList.remove('active'); // ボードを非アクティブに
        this.colorSelection.style.display = 'block';
        this.difficultySelection.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.viewFinalBoard.style.display = 'none';
        this.calculateAndUpdatePieceCounts();
        console.log('オセロゲームを開始します');
    }
    
    nextTurn() {
        // 現在の状態をバックアップ
        const prevPlayer = this.currentPlayer;
        const prevIsPlayerTurn = this.isPlayerTurn;

        // 次のプレイヤーの状態を設定
        if (prevPlayer === 'black') {
            this.currentPlayer = 'white';
            this.isPlayerTurn = (this.playerColor === 'white');
        } else {
            this.currentPlayer = 'black';
            this.isPlayerTurn = (this.playerColor === 'black');
        }
        
        console.log('nextTurn: 状態を更新:', {
            from: { player: prevPlayer, isPlayerTurn: prevIsPlayerTurn },
            to: { player: this.currentPlayer, isPlayerTurn: this.isPlayerTurn }
        });
        
        // 次のターンの処理を開始
        this.processNextTurn();
    }

    processNextTurn() {
        console.log('processNextTurn開始:', {
            currentPlayer: this.currentPlayer,
            isPlayerTurn: this.isPlayerTurn
        });

        // 両者の合法手をチェック
        const playerHasMove = this.hasValidMoves(this.playerColor);
        const cpuHasMove = this.hasValidMoves(this.cpuColor);

        console.log('合法手の状況:', {
            playerHasMove,
            cpuHasMove
        });

        // 1. まず盤面が全て埋まっているか確認
        if (this.isBoardFull()) {
            console.log('すべてのマスが埋まりました');
            this.gameOver = true;
            
            setTimeout(() => {
                this.tempMessageText.textContent = 'ゲーム終了！';
                this.tempMessage.style.display = 'block';
                
                // 結果を表示
                setTimeout(() => {
                    this.tempMessage.style.display = 'none';
                    this.showGameResult();
                }, 1000);
            }, 1000);
            
            return;
        }

        // 2. 両者とも置けない場合
        if (!playerHasMove && !cpuHasMove) {
            console.log('双方置けるマスがありません');
            this.gameOver = true;
            
            // 1秒後にメッセージを表示
            setTimeout(() => {
                this.tempMessageText.innerHTML = '双方置けるマスなし！<br>ゲーム終了！';
                this.tempMessage.style.display = 'block';
                
                // 結果を表示
                setTimeout(() => {
                    this.tempMessage.style.display = 'none';
                    this.showGameResult();
                }, 1000);
            }, 1000);
            
            return;
        }

        // 3. プレイヤーのターンでプレイヤーが置けない場合
        if (this.isPlayerTurn && !playerHasMove && cpuHasMove) {
            console.log('プレイヤーに合法手がないためスキップ');
            
            setTimeout(() => {
                this.tempMessage.classList.add('pass');
                this.tempMessageText.innerHTML = '置けるマスがありません<br>パスします';
                this.tempMessage.style.display = 'block';
                
                // CPUのターンへ
                setTimeout(() => {
                    this.tempMessage.style.display = 'none';
                    this.tempMessage.classList.remove('pass');
                    
                    this.currentPlayer = this.cpuColor;
                    this.isPlayerTurn = false;
                    this.executeCpuTurn();
                }, 2000);
            }, 1000);
            
            return;
        }

        // 4. CPUのターンでCPUが置けない場合
        if (!this.isPlayerTurn && !cpuHasMove && playerHasMove) {
            console.log('CPUに合法手がないためスキップ');
            this.currentPlayer = this.playerColor;
            
            setTimeout(() => {
                this.tempMessage.classList.add('pass');
                this.tempMessageText.innerHTML = 'CPUがパスしました<br>【あなた】のターンです';
                this.tempMessage.style.display = 'block';
                
                // playerのターンへ
                setTimeout(() => {
                    this.tempMessage.style.display = 'none';
                    this.tempMessage.classList.remove('pass');
                    this.isPlayerTurn = true;
                }, 2000);
            }, 1500);
            
            return;
        }

        // 5. CPUのターンの場合は実行
        if (!this.isPlayerTurn) {
            setTimeout(() => this.executeCpuTurn(), 500);
        }

        console.log('processNextTurn終了:', {
            currentPlayer: this.currentPlayer,
            isPlayerTurn: this.isPlayerTurn
        });

        if (this.isPlayerTurn) {
            this.highlightValidMoves(); // プレイヤーターンなら合法手をハイライト
        } else {
            this.clearHighlights(); // CPUターンならハイライトを消す
        }
    }

    showGameResult() {
        const { blackCount, whiteCount } = this.countPieces();
        let result = '';

        if (blackCount > whiteCount) {
            result = this.playerColor === 'black' 
                ? `あなたの勝ち！ (${blackCount}対${whiteCount})`
                : `あなたの負け... (${blackCount}対${whiteCount})`;
        } else if (whiteCount > blackCount) {
            result = this.playerColor === 'white'
                ? `あなたの勝ち！ (${whiteCount}対${blackCount})`
                : `あなたの負け... (${whiteCount}対${blackCount})`;
        } else {
            result = `引き分け！ (${blackCount}対${blackCount})`;
        }

        this.resultText.textContent = result;
        this.gameResult.style.display = 'block';
        this.board.style.display = 'grid';
        this.resetBtn.style.display = 'none';
        this.viewFinalBoard.style.display = 'block';
        this.viewFinalBoard.textContent = '最終盤面をみる';
    }

    isBoardFull() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.gameState[row][col] === null) return false;
            }
        }
        return true;
    }

    isValidMove(row, col) {
        if (this.gameState[row][col] !== null) {
            console.log(`isValidMove: (${row}, ${col}) はすでに駒が置かれています`);
            return false;
        }

        const currentColor = this.currentPlayer;
        const opponentColor = getOpponentColor(currentColor);

        let isValid = false;
        let validDirections = [];

        DIRECTIONS.forEach(([dx, dy]) => {
            let x = row + dx;
            let y = col + dy;
            let foundOpponent = false;
            let flippablePieces = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (this.gameState[x][y] === null) break;
                if (this.gameState[x][y] === opponentColor) {
                    foundOpponent = true;
                    flippablePieces.push([x, y]);
                } else if (this.gameState[x][y] === currentColor) {
                    if (foundOpponent) {
                        isValid = true;
                        validDirections.push([dx, dy, flippablePieces]);
                    }
                    break;
                }
                x += dx;
                y += dy;
            }
        });

        return isValid;
    }

    hasValidMoves(color) {
        const tempCurrentPlayer = this.currentPlayer;
        this.currentPlayer = color;  // 一時的にプレイヤーを切り替え

        let hasMove = false;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.gameState[row][col] === null) {
                    if (this.isValidMove(row, col)) {
                        hasMove = true;
                        console.log(`hasValidMoves: ${color}は(${row}, ${col})に置けます`);
                        break;
                    }
                }
            }
            if (hasMove) break;  // 一つでも合法手があれば終了
        }

        this.currentPlayer = tempCurrentPlayer;  // 元のプレイヤーに戻す
        if (!hasMove) {
            console.log(`hasValidMoves: ${color}は置ける場所がありません`);
        }
        return hasMove;
    }

    isValidMoveFromBoard(board, row, col, color) {
        if (board[row][col] !== null) return false;

        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const opponent = getOpponentColor(color);

        for (const [dx, dy] of directions) {
            let x = row + dx;
            let y = col + dy;
            let hasOpponent = false;

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (board[x][y] === opponent) {
                    hasOpponent = true;
                } else if (board[x][y] === color && hasOpponent) {
                    return true;
                } else {
                    break;
                }
                x += dx;
                y += dy;
            }
        }

        return false;
    }
    
    getValidMovesFromBoard(board, color) {
        const valid = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] !== null) continue;

                if (this.isValidMoveFromBoard(board, row, col, color)) {
                    valid.push([row, col]);
                }
            }
        }
        return valid;
    }

    placePiece(row, col) {
        if (!this.isValidMove(row, col)) return false;
    
        this.gameState[row][col] = this.currentPlayer;
        this.flipPieces(row, col);
        return true;
    }

    flipPieces(row, col) {
        DIRECTIONS.forEach(([dx, dy]) => {
            let x = row + dx;
            let y = col + dy;
            let piecesToFlip = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (this.gameState[x][y] === null) break;
                if (this.gameState[x][y] === this.currentPlayer) {
                    piecesToFlip.forEach(([fx, fy]) => {
                        this.gameState[fx][fy] = this.currentPlayer;
                        const cell = this.board.querySelector(`.cell[data-row="${fx}"][data-col="${fy}"]`);
                        if (cell) {
                          cell.classList.add('flipped');
                          setTimeout(() => {
                            cell.classList.remove('flipped');
                          }, 300);
                        }
                    });
                    break;
                }
                piecesToFlip.push([x, y]);
                x += dx;
                y += dy;
            }
        });
    }

    updateBoard() {
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.gameState[row][col];

            cell.className = 'cell';
            if (piece) {
                cell.classList.add(piece);
            }
        });
    }

    calculateAndUpdatePieceCounts() {
        const { blackCount, whiteCount } = this.countPieces();

        const playerCount = this.playerColor === 'black' ? blackCount : whiteCount;
        const cpuCount = this.cpuColor === 'black' ? blackCount : whiteCount;

        if (this.playerCount) {
            this.playerCount.textContent = `(${playerCount}枚)`;
        }
        if (this.cpuCount) {
            this.cpuCount.textContent = `(${cpuCount}枚)`;
        }
    }

    countPieces() {
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.gameState[row][col] === 'black') blackCount++;
                if (this.gameState[row][col] === 'white') whiteCount++;
            }
        }
        
        return { blackCount, whiteCount };
    }

    updateInfo() {
        if (this.playerColor === 'black') {
            this.playerIcon.style.backgroundColor = 'black';
            this.cpuIcon.style.backgroundColor = 'white';
        } else if (this.playerColor === 'white') {
            this.playerIcon.style.backgroundColor = 'white';
            this.cpuIcon.style.backgroundColor = 'black';
        }

        this.playerInfo.style.display = 'flex';
    }

    executeCpuTurn() {
        if (this.isPlayerTurn || this.gameOver) {
            console.log('CPUのターンではありません');
            return;
        }

        // CPUの合法手をチェック
        const validMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.gameState[row][col] === null && this.isValidMove(row, col)) {
                    validMoves.push([row, col]);
                }
            }
        }

        console.log('executeCpuTurn: validMoves =', validMoves);

        if (validMoves.length > 0) {
            let move;
            switch (this.cpuDifficulty) {
                case 1:
                    move = this.selectMoveRandom(validMoves);
                    break;
                case 2:
                    move = this.selectMoveGreedy(validMoves);
                    break;
                case 3:
                    move = this.selectMoveByEvaluation(validMoves);
                    break;
                case 99:
                    move = this.selectMoveOni(validMoves);
                    break;
            }

            const [row, col] = move;
            console.log(`CPU: (${row}, ${col})に置きます`);

            if (this.placePiece(row, col)) {
                this.updateBoard();
                this.calculateAndUpdatePieceCounts();
                this.nextTurn();
            }
        } else {
            console.log('CPUが置けるマスがないため、パスします');
            this.nextTurn();
        }
    }

    selectMoveRandom(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    selectMoveGreedy(validMoves) {
        let maxFlips = -1;
        let bestMove = null;

        for (const [row, col] of validMoves) {
            const flips = this.countFlippableDiscs(row, col, this.cpuColor);
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = [row, col];
            }
        }
        return bestMove;
    }

    selectMoveByEvaluation(validMoves) {
        let bestScore = -Infinity;
        let bestMove = null;

        console.log('検討中の手とスコア:');
        for (const [row, col] of validMoves) {
            const simulatedBoard = this.simulateMove(row, col, this.cpuColor);
            const score = this.evaluateBoardSimple(simulatedBoard, this.cpuColor);
            console.log(`手: (${row}, ${col}), スコア: ${score}`);

            if (score > bestScore) {
                bestScore = score;
                bestMove = [row, col];
            }
        }

        console.log(`最終的に選んだ手: (${bestMove[0]}, ${bestMove[1]}), スコア: ${bestScore}`);
        return bestMove;
    }

    selectMoveOni(validMoves) {
        if (validMoves.length === 0) {
            console.error('selectMoveOni: validMovesが空です。合法手がありません。');
            return null;
        }

        let bestScore = -Infinity;
        let bestMove = null;

        console.log('LEVEL 鬼 👹 検討中の手とスコア:');
        for (const [row, col] of validMoves) {
            // 自分（CPU）の1手目をシミュレーション
            const boardAfterMyMove = this.simulateMove(row, col, this.cpuColor);
            const opponentMoves = this.getValidMovesFromBoard(boardAfterMyMove, this.playerColor);

            let worstOpponentScore = Infinity;

            for (const [orow, ocol] of opponentMoves) {
                // 相手（プレイヤー）の応手をシミュレーション
                const boardAfterOpponent = this.simulateMoveFromBoard(boardAfterMyMove, orow, ocol, this.playerColor);
                const myReplies = this.getValidMovesFromBoard(boardAfterOpponent, this.cpuColor);

                let bestReplyScore = -Infinity;

                for (const [rrow, rcol] of myReplies) {
                    // 再度自分（CPU）の応手をシミュレーション
                    const replyBoard = this.simulateMoveFromBoard(boardAfterOpponent, rrow, rcol, this.cpuColor);

                    // この時点での相手の合法手を取得して、評価関数に渡す
                    const futureOpponentMoves = this.getValidMovesFromBoard(replyBoard, this.playerColor);
                    const score = this.evaluateBoardStrategic(replyBoard, this.cpuColor, futureOpponentMoves);

                    bestReplyScore = Math.max(bestReplyScore, score);
                }

                // 相手にとって最悪の手（= 自分にとって最良の評価）を選ぶ
                worstOpponentScore = Math.min(worstOpponentScore, bestReplyScore);
            }

            console.log(`手: (${row}, ${col}), スコア: ${worstOpponentScore}`);

            if (worstOpponentScore > bestScore) {
                bestScore = worstOpponentScore;
                bestMove = [row, col];
            }
        }

        if (!bestMove) {
            console.error('selectMoveOni: bestMoveが選択されませんでした。');
            return validMoves[0]; // デフォルトで最初の合法手を返す
        }

        console.log(`LEVEL 鬼 👹 最終的に選んだ手: (${bestMove[0]}, ${bestMove[1]}), スコア: ${bestScore}`);
        return bestMove;
    }
    
    simulateMove(row, col, color) {
        const simulatedBoard = JSON.parse(JSON.stringify(this.gameState));
        simulatedBoard[row][col] = color;

        DIRECTIONS.forEach(([dx, dy]) => {
            let x = row + dx;
            let y = col + dy;
            let piecesToFlip = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (simulatedBoard[x][y] === null) break;
                if (simulatedBoard[x][y] === color) {
                    piecesToFlip.forEach(([fx, fy]) => {
                        simulatedBoard[fx][fy] = color;
                    });
                    break;
                }
                piecesToFlip.push([x, y]);
                x += dx;
                y += dy;
            }
        });

        return simulatedBoard;
    }

    simulateMoveFromBoard(board, row, col, color) {
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[row][col] = color;

        for (const [dx, dy] of DIRECTIONS) {
            let x = row + dx;
            let y = col + dy;
            const toFlip = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (newBoard[x][y] === null) break;
                if (newBoard[x][y] === color) {
                    toFlip.forEach(([fx, fy]) => newBoard[fx][fy] = color);
                    break;
                }
                toFlip.push([x, y]);
                x += dx;
                y += dy;
            }
        }

        return newBoard;
    }

    evaluateBoardSimple(board, color) {
        let score = 0;
        const opponent = getOpponentColor(color);

        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        for (const [x, y] of corners) {
            if (board[x][y] === color) score += 100;
        }

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === color) score += 1;
                else if (board[row][col] === opponent) score -= 1;
            }
        }

        return score;
    }

    evaluateBoardStrategic(board, color, opponentMoves) {
        let score = 0;
        const opponent = getOpponentColor(color);

        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        const dangerZones = [
            [0, 1], [1, 0], [1, 1], [0, 6], [1, 6], [1, 7],
            [6, 0], [6, 1], [7, 1], [6, 6], [6, 7], [7, 6]
        ];

        // ① 自分が角を取った場合（今の手で新たに角を取った）
        for (const [x, y] of corners) {
            if (board[x][y] === color) score += 100;
        }

        // ② 相手が角を取れるようになった場合（opponentMovesに角がある）
        for (const [x, y] of opponentMoves) {
            if (corners.some(([cx, cy]) => cx === x && cy === y)) {
                score -= 100;
            }
        }

        // ③ 自分が危険ゾーンに打ってしまった（今打った場所が含まれるか）
        for (const [x, y] of dangerZones) {
            if (board[x][y] === color) {
                score -= 20;
            }
        }

        // ④ 相手が危険ゾーンにしか打てない状況を作った
        if (
            opponentMoves.length > 0 &&
            opponentMoves.every(([x, y]) => dangerZones.some(([dx, dy]) => dx === x && dy === y))
        ) {
            score += 40;
        }
        // ⑤ 相手の合法手の中に危険ゾーンが含まれている
        else if (
            opponentMoves.some(([x, y]) => dangerZones.some(([dx, dy]) => dx === x && dy === y))
        ) {
            score += 20;
        }

        // ⑥ 駒の数差によるスコア（最終的な石数差）
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === color) score += 1;
                else if (board[row][col] === opponent) score -= 1;
            }
        }

        return score;
    }
    
    countFlippableDiscs(row, col, color) {
        let totalFlips = 0;
        for (const [dx, dy] of DIRECTIONS) {
            let x = row + dx;
            let y = col + dy;
            let flips = 0;

            while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.gameState[x][y] !== null) {
                if (this.gameState[x][y] === color) {
                    totalFlips += flips;
                    break;
                }
                flips++;
                x += dx;
                y += dy;
            }
        }
        return totalFlips;
    }

    loadTestPattern(pattern) {
        // 勝敗ダイアログを非表示にする
        this.gameResult.style.display = 'none';
        
        // 盤面をクリア
        this.gameState = Array(8).fill().map(() => Array(8).fill(null));
        
        // プレイヤーの色を常に黒に設定
        this.playerColor = 'black';
        this.cpuColor = 'white';
        this.currentPlayer = 'black';
        this.isPlayerTurn = true;
        this.gameOver = false;
        
        // プレイヤー情報の更新
        this.updateInfo();
        
        switch(pattern) {
            case 'win':
                // あと１手で勝てるパターン（黒が(7,7)に置くと勝ち）
                const boardStateForWin = [
                    ['black','black','black','black','black','black','black','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','white','white','white','white','white','white','black'],
                    ['black','black','black','black','black','black','black',null],
                ];
                this.gameState = boardStateForWin;
                break;
                
            case 'lose':
                // あと１手で負けるパターン（黒が(0,0)に置くと負け）                
                const boardStateForLose = [
                    [null,'white','black','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                ];
                this.gameState = boardStateForLose;
                break;
                
            case 'draw':
                // 引き分けのパターン（黒が(7,7)に置くと引き分け）
                const boardStateForDraw = [
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['black','black','black','black','black','black','black','black'],
                    ['black','black','black','black','black','black','black','black'],
                    ['black','black','black','black','black','black','black','black'],
                    ['black','black','black','black','black','black','white',null],
                ];
                this.gameState = boardStateForDraw;
                break;
                
            case 'playerpass':
                // プレイヤーがパスするパターン
                const boardStateForPlayerPass = [
                    [null,'black','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','white','white'],
                    ['white','white','white','white','white','white','black','white'],
                    ['white','black','white','white',null,'black',null,'white'],
                ];
                this.gameState = boardStateForPlayerPass;
                break;
                
            case 'cpupass':
                // CPUがパスするパターン
                const boardStateForCPUPass = [
                    ['white','white','white','white','black','white','white','white'],
                    ['white','white','white','white','black','white','white','white'],
                    ['black','white','white','white','black','white','white','white'],
                    ['white','black','white','white','black','white','white','white'],
                    ['white','white','black','white','black','white','white','white'],
                    ['white','white','white','black','black','white','white','white'],
                    ['white','white','white','white','black','white','white','white'],
                    ['black','black','black','white',null,'black','black',null],
                ];
                this.gameState = boardStateForCPUPass;
                break;

            case 'gameend':
                // ゲームが終了するパターン（黒が(0,7)に置くと即ゲーム終了）
                const boardStateForGameEnd = [
                    [null,'black','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['white','white','white','white','white','white','white','black'],
                    ['black','black','black','white',null,'black','black',null],
                ];
                this.gameState = boardStateForGameEnd;
                break;

            case 'doubleplayerpass':
                // プレイヤーが2回連続パスするパターン
                const boardStateForDoublePassScenario = [
                    [null, 'black', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
                    ['white', 'white', 'white', 'white', 'white', 'black', 'white', 'black'],
                    ['white', 'black', 'white', null, null, null, null, null],
                ];
                this.gameState = boardStateForDoublePassScenario;
                break;

                case 'doublecpupass':
                // CPUが2回連続パスするパターン
                const boardStateForDoubleCpuPassScenario = [
                    [null, 'white', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'black', 'black', 'black'],
                    ['black', 'black', 'black', 'black', 'black', 'white', 'black', 'white'],
                    ['black', 'white', 'white', 'white', null, null, null, null],
                ]            
                this.gameState = boardStateForDoubleCpuPassScenario;
                break;
        }
        
        this.updateBoard();
        this.calculateAndUpdatePieceCounts();
        this.colorSelection.style.display = 'none';
        this.board.style.display = 'grid';
        this.board.classList.add('active'); // ボードをアクティブに
        this.resetBtn.style.display = 'block';
        this.viewFinalBoard.style.display = 'none';
    }

    highlightValidMoves() {
        this.clearHighlights(); // まずリセット

        if (!this.isPlayerTurn) return;

        const cells = this.board.querySelectorAll('.cell');

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.isValidMove(row, col)) {
                cell.classList.add('highlight');
            }
        });

        // 3秒後に合法手に点滅クラスを追加
        if (this.highlightPulseTimeout) clearTimeout(this.highlightPulseTimeout);
        this.highlightPulseTimeout = setTimeout(() => {
            const highlights = this.board.querySelectorAll('.highlight');
            highlights.forEach(cell => {
                cell.classList.add('pulsing');
            });
        }, 3000);
    }

    clearHighlights() {
        const highlightedCells = this.board.querySelectorAll('.highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('highlight', 'pulsing');
        });

        if (this.highlightPulseTimeout) {
            clearTimeout(this.highlightPulseTimeout);
            this.highlightPulseTimeout = null;
        }
    }
}
const game = new OthelloGame();

// ラベルと駒数を表示する関数
function showPieceCounts() {
    const playerLabel = document.querySelector(SELECTORS.playerLabel);
    const playerCount = document.querySelector(SELECTORS.playerCount);
    const cpuLabel = document.querySelector(SELECTORS.cpuLabel);
    const cpuCount = document.querySelector(SELECTORS.cpuCount);

    if (playerLabel) playerLabel.style.display = 'inline';
    if (playerCount) playerCount.style.display = 'inline';
    if (cpuLabel) cpuLabel.style.display = 'inline';
    if (cpuCount) cpuCount.style.display = 'inline';
}


// 駒の色が選択されたときにラベルと駒数を表示
const colorButtons = document.querySelectorAll(SELECTORS.colorBtn);
colorButtons.forEach(button => {
    button.addEventListener('click', () => {
        showPieceCounts();
    });
});