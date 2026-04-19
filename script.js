class TetrisGame {
    constructor() {
        // 游戏画布设置
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 游戏参数
        this.blockSize = 30;
        this.rows = 20;
        this.cols = 10;
        
        // 7种标准方块的形状和颜色
        this.shapes = [
            // I形
            {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: '#00f0f0'
            },
            // J形
            {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#0000f0'
            },
            // L形
            {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#f0a000'
            },
            // O形
            {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#f0f000'
            },
            // S形
            {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#00f000'
            },
            // T形
            {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#a000f0'
            },
            // Z形
            {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#f00000'
            }
        ];
        
        // 游戏状态
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1; // 当前等级
        this.totalLinesCleared = 0; // 累计消除行数
        this.gameOver = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.baseDropSpeed = 800; // 基础下落速度（毫秒）
        this.dropSpeed = 800; // 当前下落速度（毫秒）
        this.fastDrop = false;
        
        // 键盘控制状态
        this.keyStates = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowDown: false
        };
        
        // 按键重复控制
        this.lastMoveTime = 0;
        this.moveDelay = 150;
        
        // DOM 元素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 绑定事件处理
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }
    
    // 初始化游戏板
    initBoard() {
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = null;
            }
        }
    }
    
    // 随机生成方块
    generatePiece() {
        const index = Math.floor(Math.random() * this.shapes.length);
        const shapeData = this.shapes[index];
        return {
            shape: JSON.parse(JSON.stringify(shapeData.shape)),
            color: shapeData.color,
            x: Math.floor((this.cols - shapeData.shape[0].length) / 2),
            y: 0
        };
    }
    
    // 旋转方块（顺时针）
    rotatePiece(piece) {
        const size = piece.shape.length;
        const rotated = [];
        
        for (let i = 0; i < size; i++) {
            rotated[i] = [];
            for (let j = 0; j < size; j++) {
                rotated[i][j] = piece.shape[size - 1 - j][i];
            }
        }
        
        return {
            ...piece,
            shape: rotated
        };
    }
    
    // 检查碰撞
    checkCollision(piece, offsetX = 0, offsetY = 0) {
        const shape = piece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = piece.x + col + offsetX;
                    const newY = piece.y + row + offsetY;
                    
                    // 检查边界
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }
                    
                    // 检查是否已存在方块
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 将方块固定到游戏板
    fixPiece() {
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    // 检查并消除完整行
    checkLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            let isComplete = true;
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col]) {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete) {
                linesCleared++;
                // 移除当前行并在顶部添加空行
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(null));
                row++; // 重新检查当前行
            }
        }
        
        // 计算得分：消1行100分，同时消多行给予额外加成
        if (linesCleared > 0) {
            // 基础分：每行100分
            let lineScore = linesCleared * 100;
            
            // 额外加成：消2行+100，消3行+300，消4行+600
            const bonusScore = [0, 0, 100, 300, 600];
            lineScore += bonusScore[linesCleared];
            
            this.score += lineScore;
            this.updateScore();
            
            // 更新累计消行数并检查升级
            this.totalLinesCleared += linesCleared;
            const newLevel = Math.floor(this.totalLinesCleared / 10) + 1;
            
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateLevel();
            }
        }
    }
    
    // 绘制单个方块
    drawBlock(ctx, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // 添加高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 1, y + 1, size - 2, size / 3);
        
        // 添加阴影效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 1, y + size - size / 3, size - 2, size / 3 - 1);
    }
    
    // 绘制游戏板
    drawBoard() {
        // 清空画布
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= this.rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.blockSize);
            this.ctx.lineTo(this.canvas.width, row * this.blockSize);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.blockSize, 0);
            this.ctx.lineTo(col * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制已固定的方块
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(
                        this.ctx,
                        col * this.blockSize,
                        row * this.blockSize,
                        this.board[row][col],
                        this.blockSize
                    );
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawBlock(
                            this.ctx,
                            (this.currentPiece.x + col) * this.blockSize,
                            (this.currentPiece.y + row) * this.blockSize,
                            this.currentPiece.color,
                            this.blockSize
                        );
                    }
                }
            }
            
            // 绘制幽灵方块（预览落点）
            this.drawGhostPiece();
        }
    }
    
    // 绘制幽灵方块（预览落点）
    drawGhostPiece() {
        let dropDistance = 0;
        
        // 计算最大下落距离
        while (!this.checkCollision(this.currentPiece, 0, dropDistance + 1)) {
            dropDistance++;
        }
        
        if (dropDistance > 0) {
            const shape = this.currentPiece.shape;
            this.ctx.globalAlpha = 0.3;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawBlock(
                            this.ctx,
                            (this.currentPiece.x + col) * this.blockSize,
                            (this.currentPiece.y + row + dropDistance) * this.blockSize,
                            this.currentPiece.color,
                            this.blockSize
                        );
                    }
                }
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    // 绘制下一个方块预览
    drawNextPiece() {
        if (!this.nextPiece) return;
        
        this.nextCtx.fillStyle = '#2c3e50';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const shape = this.nextPiece.shape;
        const blockSize = 25;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(
                        this.nextCtx,
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        this.nextPiece.color,
                        blockSize
                    );
                }
            }
        }
    }
    
    // 移动方块
    movePiece(dx, dy) {
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }
    
    // 旋转方块
    rotateCurrentPiece() {
        const rotated = this.rotatePiece(this.currentPiece);
        
        // 尝试直接旋转
        if (!this.checkCollision(rotated)) {
            this.currentPiece = rotated;
            return;
        }
        
        // 尝试墙边踢墙（Wall Kick）
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            const kickedPiece = { ...rotated, x: rotated.x + kick };
            if (!this.checkCollision(kickedPiece)) {
                this.currentPiece = kickedPiece;
                return;
            }
        }
    }
    
    // 硬降落（直接下落到底）
    hardDrop() {
        while (this.movePiece(0, 1)) {
            // 硬降落不再额外加分，只在消行时计分
        }
        this.lockPiece();
    }
    
    // 锁定方块
    lockPiece() {
        this.fixPiece();
        this.checkLines();
        
        // 生成新方块
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generatePiece();
        this.drawNextPiece();
        
        // 检查游戏是否结束
        if (this.checkCollision(this.currentPiece)) {
            this.endGame();
        }
    }
    
    // 更新得分显示
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    // 更新等级显示和下落速度
    updateLevel() {
        this.levelElement.textContent = this.level;
        
        // 每升一级，下落速度减少10%（最少100毫秒）
        const speedReduction = Math.min(this.level - 1, 10); // 最多减少10级
        this.dropSpeed = Math.max(100, this.baseDropSpeed * (1 - speedReduction * 0.1));
    }
    
    // 处理键盘按下
    handleKeyDown(e) {
        // 暂停期间屏蔽所有键盘输入
        if (this.isPaused || this.gameOver || !this.currentPiece) return;
        
        if (e.code in this.keyStates) {
            e.preventDefault();
            this.keyStates[e.code] = true;
        }
        
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            this.rotateCurrentPiece();
        }
        
        if (e.code === 'Space') {
            e.preventDefault();
            this.hardDrop();
        }
        
        if (e.code === 'ArrowDown') {
            this.fastDrop = true;
        }
    }
    
    // 处理键盘松开
    handleKeyUp(e) {
        // 暂停期间不处理键盘松开事件，避免状态不一致
        if (this.isPaused) return;
        
        if (e.code in this.keyStates) {
            this.keyStates[e.code] = false;
        }
        
        if (e.code === 'ArrowDown') {
            this.fastDrop = false;
        }
    }
    
    // 处理连续移动
    handleContinuousMovement(timestamp) {
        if (timestamp - this.lastMoveTime < this.moveDelay) return;
        
        if (this.keyStates.ArrowLeft) {
            this.movePiece(-1, 0);
            this.lastMoveTime = timestamp;
        }
        
        if (this.keyStates.ArrowRight) {
            this.movePiece(1, 0);
            this.lastMoveTime = timestamp;
        }
        
        if (this.keyStates.ArrowDown) {
            this.movePiece(0, 1);
            this.lastMoveTime = timestamp;
        }
    }
    
    // 游戏循环
    gameLoopFunction(timestamp) {
        if (this.isPaused || this.gameOver) {
            this.gameLoop = requestAnimationFrame((t) => this.gameLoopFunction(t));
            return;
        }
        
        // 处理连续移动
        this.handleContinuousMovement(timestamp);
        
        // 自动下落
        const currentDropSpeed = this.fastDrop ? this.dropSpeed / 10 : this.dropSpeed;
        
        if (!this.lastDropTime) {
            this.lastDropTime = timestamp;
        }
        
        if (timestamp - this.lastDropTime > currentDropSpeed) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDropTime = timestamp;
        }
        
        // 绘制
        this.drawBoard();
        
        this.gameLoop = requestAnimationFrame((t) => this.gameLoopFunction(t));
    }
    
    // 开始游戏
    startGame() {
        this.initBoard();
        this.score = 0;
        this.level = 1;
        this.totalLinesCleared = 0;
        this.dropSpeed = this.baseDropSpeed;
        
        this.updateScore();
        this.updateLevel();
        
        this.gameOver = false;
        this.isPaused = false;
        
        // 生成初始方块
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        
        // 更新界面
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'block';
        this.pauseBtn.textContent = '暂停';
        this.gameOverElement.style.display = 'none';
        
        // 绘制
        this.drawBoard();
        this.drawNextPiece();
        
        // 开始游戏循环
        this.lastDropTime = 0;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.gameLoop = requestAnimationFrame((t) => this.gameLoopFunction(t));
    }
    
    // 暂停/继续游戏
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    }
    
    // 游戏结束
    endGame() {
        this.gameOver = true;
        this.pauseBtn.style.display = 'none';
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'flex';
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
    
    // 重新开始游戏
    restartGame() {
        this.startGame();
    }
}

// 初始化游戏
const game = new TetrisGame();

// 绘制初始界面
game.drawBoard();
