class TetrisGame {
    constructor() {
        // 难度配置
        this.difficulties = {
            easy: {
                baseSpeed: 1000,
                scoreMultiplier: 0.8,
                insertLines: false,
                insertInterval: 0
            },
            normal: {
                baseSpeed: 800,
                scoreMultiplier: 1.0,
                insertLines: true,
                insertInterval: 500
            },
            hard: {
                baseSpeed: 500,
                scoreMultiplier: 1.5,
                insertLines: true,
                insertInterval: 300
            }
        };
        
        // 游戏画布设置
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
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
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.highScore = this.loadHighScore(); // 最高分
        this.level = 1; // 当前等级
        this.totalLinesCleared = 0; // 累计消除行数
        this.gameOver = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.baseDropSpeed = 800; // 基础下落速度（毫秒）
        this.dropSpeed = 800; // 当前下落速度（毫秒）
        this.fastDrop = false;
        this.showGhostPiece = this.loadGhostPieceSetting(); // 是否显示幽灵方块
        
        // 消行动画相关
        this.linesToClear = [];
        this.clearAnimationProgress = 0;
        this.clearAnimationDuration = 300; // 300ms 消行动画
        
        // 难度和模式设置（从 localStorage 加载）
        this.difficulty = this.loadDifficultySetting();
        this.bombMode = this.loadBombModeSetting();
        this.scoreMultiplier = 1.0;
        this.insertLines = true;
        this.insertInterval = 500;
        this.lastInsertScore = 0;
        
        // 炸弹方块颜色
        this.bombColor = '#ff00ff';
        
        // 爆炸特效相关
        this.explosionEffects = []; // 当前活跃的爆炸特效
        this.isAnimating = false; // 是否正在播放动画（阻止正常游戏逻辑）
        
        // 下落动画相关
        this.fallingBlocks = []; // 当前正在下落的方块动画
        
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
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.gameOverElement = document.getElementById('gameOver');
        this.newRecordElement = document.getElementById('newRecord');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        this.ghostPieceToggle = document.getElementById('ghostPieceToggle');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.bombModeToggle = document.getElementById('bombModeToggle');
        
        // 帮助弹窗相关
        this.helpBtn = document.getElementById('helpBtn');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelp = document.getElementById('closeHelp');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        
        // 同步开关按钮状态
        this.syncGhostPieceToggle();
        this.syncDifficultySelect();
        this.syncBombModeToggle();
        
        // 初始化游戏板
        this.initBoard();
        
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
        
        // 幽灵方块开关事件
        this.ghostPieceToggle.addEventListener('change', (e) => {
            this.showGhostPiece = e.target.checked;
            this.saveGhostPieceSetting();
        });
        
        // 难度选择事件
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.saveDifficultySetting();
        });
        
        // 炸弹模式开关事件
        this.bombModeToggle.addEventListener('change', (e) => {
            this.bombMode = e.target.checked;
            this.saveBombModeSetting();
        });
        
        // 帮助弹窗事件
        this.helpBtn.addEventListener('click', () => this.showHelpModal());
        this.closeHelp.addEventListener('click', () => this.hideHelpModal());
        this.closeHelpBtn.addEventListener('click', () => this.hideHelpModal());
        
        // 点击弹窗外部关闭
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelpModal();
            }
        });
    }
    
    // 显示帮助弹窗
    showHelpModal() {
        this.helpModal.style.display = 'flex';
    }
    
    // 隐藏帮助弹窗
    hideHelpModal() {
        this.helpModal.style.display = 'none';
    }
    
    // 同步难度选择器状态
    syncDifficultySelect() {
        this.difficultySelect.value = this.difficulty;
    }
    
    // 同步炸弹模式开关状态
    syncBombModeToggle() {
        this.bombModeToggle.checked = this.bombMode;
    }
    
    // 从 localStorage 加载最高分
    loadHighScore() {
        const saved = localStorage.getItem('tetrisHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    // 保存最高分到 localStorage
    saveHighScore() {
        localStorage.setItem('tetrisHighScore', this.highScore.toString());
    }
    
    // 更新最高分显示
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    // 从 localStorage 加载幽灵方块开关设置
    loadGhostPieceSetting() {
        const saved = localStorage.getItem('tetrisShowGhostPiece');
        return saved !== null ? saved === 'true' : true;
    }
    
    // 保存幽灵方块开关设置到 localStorage
    saveGhostPieceSetting() {
        localStorage.setItem('tetrisShowGhostPiece', this.showGhostPiece.toString());
    }
    
    // 从 localStorage 加载难度设置
    loadDifficultySetting() {
        const saved = localStorage.getItem('tetrisDifficulty');
        return saved ? saved : 'normal';
    }
    
    // 保存难度设置到 localStorage
    saveDifficultySetting() {
        localStorage.setItem('tetrisDifficulty', this.difficulty);
    }
    
    // 从 localStorage 加载炸弹模式设置
    loadBombModeSetting() {
        const saved = localStorage.getItem('tetrisBombMode');
        return saved !== null ? saved === 'true' : false;
    }
    
    // 保存炸弹模式设置到 localStorage
    saveBombModeSetting() {
        localStorage.setItem('tetrisBombMode', this.bombMode.toString());
    }
    
    // 同步开关按钮状态
    syncGhostPieceToggle() {
        this.ghostPieceToggle.checked = this.showGhostPiece;
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
        const shape = JSON.parse(JSON.stringify(shapeData.shape));
        
        // 炸弹模式下，随机决定是否生成炸弹方块
        let bombPositions = [];
        if (this.bombMode && Math.random() < 0.3) {
            // 找到所有非零的位置
            const positions = [];
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        positions.push({ row, col });
                    }
                }
            }
            // 随机选择一个位置作为炸弹
            if (positions.length > 0) {
                const bombPos = positions[Math.floor(Math.random() * positions.length)];
                bombPositions.push(bombPos);
            }
        }
        
        return {
            shape: shape,
            color: shapeData.color,
            x: Math.floor((this.cols - shapeData.shape[0].length) / 2),
            y: 0,
            bombPositions: bombPositions
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
        
        // 旋转炸弹位置
        let rotatedBombPositions = [];
        if (piece.bombPositions && piece.bombPositions.length > 0) {
            rotatedBombPositions = piece.bombPositions.map(pos => {
                // 顺时针旋转90度的坐标变换：(i, j) -> (j, size - 1 - i)
                return {
                    row: pos.col,
                    col: size - 1 - pos.row
                };
            });
        }
        
        return {
            ...piece,
            shape: rotated,
            bombPositions: rotatedBombPositions
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
        const bombPositions = this.currentPiece.bombPositions || [];
        const actualBombPositions = [];
        
        // 先固定所有方块，并记录炸弹的实际位置
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        // 检查是否是炸弹位置
                        const isBomb = bombPositions.some(pos => pos.row === row && pos.col === col);
                        
                        if (isBomb) {
                            actualBombPositions.push({ x: boardX, y: boardY });
                            // 炸弹方块用特殊颜色
                            this.board[boardY][boardX] = this.bombColor;
                        } else {
                            this.board[boardY][boardX] = this.currentPiece.color;
                        }
                    }
                }
            }
        }
        
        // 处理炸弹爆炸
        if (actualBombPositions.length > 0) {
            this.explodeBombs(actualBombPositions);
        }
    }
    
    // 炸弹爆炸：创建爆炸特效动画
    explodeBombs(bombPositions) {
        // 收集所有需要消除的位置
        const positionsToClear = new Set();
        
        bombPositions.forEach(bomb => {
            // 消除炸弹本身和周围一圈（3x3范围）
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = bomb.x + dx;
                    const y = bomb.y + dy;
                    
                    // 检查边界
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        positionsToClear.add(`${x},${y}`);
                    }
                }
            }
        });
        
        // 转换为数组
        const clearPositions = Array.from(positionsToClear).map(pos => {
            const [x, y] = pos.split(',').map(Number);
            return { x, y };
        });
        
        // 计算得分：每个消除的方块得10分
        const clearScore = positionsToClear.size * 10 * this.scoreMultiplier;
        this.score += Math.floor(clearScore);
        this.updateScore();
        
        // 创建爆炸特效
        this.createExplosionEffect(bombPositions, clearPositions);
    }
    
    // 创建爆炸特效
    createExplosionEffect(bombPositions, clearPositions) {
        this.isAnimating = true;
        
        // 保存需要消除的位置
        this.positionsToClear = clearPositions;
        
        // 为每个炸弹创建爆炸特效
        bombPositions.forEach(bomb => {
            this.explosionEffects.push({
                x: bomb.x,
                y: bomb.y,
                startTime: performance.now(),
                duration: 500, // 500ms 动画
                maxRadius: this.blockSize * 1.5 // 最大半径
            });
        });
    }
    
    // 更新爆炸特效
    updateExplosionEffects(timestamp) {
        for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
            const effect = this.explosionEffects[i];
            const progress = (timestamp - effect.startTime) / effect.duration;
            
            if (progress >= 1) {
                // 动画结束，移除特效
                this.explosionEffects.splice(i, 1);
            }
        }
        
        // 如果所有特效都结束了，执行方块消除和下落
        if (this.explosionEffects.length === 0 && this.positionsToClear && this.positionsToClear.length > 0) {
            this.executeClearAndFall();
        }
    }
    
    // 执行方块消除和下落
    executeClearAndFall() {
        // 消除方块
        this.positionsToClear.forEach(pos => {
            this.board[pos.y][pos.x] = null;
        });
        
        // 准备下落动画
        this.prepareFallingAnimation();
        
        this.positionsToClear = null;
    }
    
    // 准备下落动画
    prepareFallingAnimation() {
        this.fallingBlocks = [];
        
        // 对每一列进行处理
        for (let col = 0; col < this.cols; col++) {
            // 从底部往上找，记录每个方块需要下落的距离
            let writePos = this.rows - 1;
            const columnBlocks = [];
            
            // 收集当前列的所有方块
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    columnBlocks.push({
                        color: this.board[row][col],
                        originalRow: row,
                        targetRow: writePos
                    });
                    writePos--;
                }
            }
            
            // 计算需要下落的方块
            columnBlocks.forEach(block => {
                if (block.originalRow !== block.targetRow) {
                    this.fallingBlocks.push({
                        col: col,
                        originalRow: block.originalRow,
                        targetRow: block.targetRow,
                        color: block.color,
                        startTime: performance.now(),
                        duration: 300, // 300ms 下落动画
                        delay: (this.rows - block.originalRow) * 30 // 延迟，让下落更自然
                    });
                }
            });
        }
        
        // 如果没有需要下落的方块，直接结束动画
        if (this.fallingBlocks.length === 0) {
            this.finishAnimation();
        }
    }
    
    // 更新下落动画
    updateFallingAnimation(timestamp) {
        if (this.fallingBlocks.length === 0) return;
        
        let allComplete = true;
        
        this.fallingBlocks.forEach(block => {
            const elapsed = timestamp - block.startTime - block.delay;
            
            if (elapsed >= 0) {
                const progress = Math.min(elapsed / block.duration, 1);
                if (progress < 1) {
                    allComplete = false;
                }
            } else {
                allComplete = false;
            }
        });
        
        if (allComplete) {
            // 所有方块都已下落到位，更新游戏板状态
            this.updateBoardAfterFall();
            this.finishAnimation();
        }
    }
    
    // 更新游戏板状态（下落完成后）
    updateBoardAfterFall() {
        // 清空游戏板
        this.initBoard();
        
        // 重新放置所有方块到目标位置
        this.fallingBlocks.forEach(block => {
            this.board[block.targetRow][block.col] = block.color;
        });
    }
    
    // 结束动画状态
    finishAnimation() {
        this.fallingBlocks = [];
        this.isAnimating = false;
        
        // 检查是否有可以消除的完整行
        this.checkLines();
    }
    
    // 爆炸后让方块下落填补空隙
    dropBlocksAfterExplosion() {
        for (let col = 0; col < this.cols; col++) {
            // 从底部往上找
            let writePos = this.rows - 1;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (row !== writePos) {
                        this.board[writePos][col] = this.board[row][col];
                        this.board[row][col] = null;
                    }
                    writePos--;
                }
            }
        }
    }
    
    // 检查并消除完整行
    checkLines() {
        this.linesToClear = [];
        
        // 首先找出所有需要消除的行
        for (let row = 0; row < this.rows; row++) {
            let isComplete = true;
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col]) {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete) {
                this.linesToClear.push(row);
            }
        }
        
        // 如果有需要消除的行，开始动画
        if (this.linesToClear.length > 0) {
            this.startClearAnimation();
        }
    }
    
    // 开始消行动画
    startClearAnimation() {
        this.isAnimating = true;
        this.clearAnimationStartTime = performance.now();
        this.clearAnimationProgress = 0;
    }
    
    // 更新消行动画
    updateClearAnimation(timestamp) {
        if (this.linesToClear.length === 0) return false;
        
        const elapsed = timestamp - this.clearAnimationStartTime;
        this.clearAnimationProgress = Math.min(elapsed / this.clearAnimationDuration, 1);
        
        if (this.clearAnimationProgress >= 1) {
            // 动画结束，执行实际的消行操作
            this.executeClearLines();
            return true;
        }
        
        return false;
    }
    
    // 执行实际的消行操作
    executeClearLines() {
        const linesCleared = this.linesToClear.length;
        
        // 移除需要消除的行（从下往上处理，避免索引问题）
        this.linesToClear.sort((a, b) => b - a);
        this.linesToClear.forEach(row => {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.cols).fill(null));
        });
        
        // 计算得分：消1行100分，同时消多行给予额外加成
        // 基础分：每行100分
        let lineScore = linesCleared * 100;
        
        // 额外加成：消2行+100，消3行+300，消4行+600
        const bonusScore = [0, 0, 100, 300, 600];
        lineScore += bonusScore[linesCleared];
        
        // 应用难度得分倍率
        lineScore = Math.floor(lineScore * this.scoreMultiplier);
        
        this.score += lineScore;
        this.updateScore();
        
        // 更新累计消行数并检查升级
        this.totalLinesCleared += linesCleared;
        const newLevel = Math.floor(this.totalLinesCleared / 10) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateLevel();
        }
        
        // 重置消行状态
        this.linesToClear = [];
        this.clearAnimationProgress = 0;
        this.isAnimating = false;
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
        
        // 绘制已固定的方块（动画期间可能需要不同的处理）
        for (let row = 0; row < this.rows; row++) {
            // 检查当前行是否在需要消除的行中
            const isLineToClear = this.linesToClear.includes(row);
            
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    if (isLineToClear && this.clearAnimationProgress > 0) {
                        // 消行动画：显示闪光效果
                        const x = col * this.blockSize;
                        const y = row * this.blockSize;
                        
                        // 先绘制原始方块
                        this.drawBlock(
                            this.ctx,
                            x,
                            y,
                            this.board[row][col],
                            this.blockSize
                        );
                        
                        // 计算闪光强度：使用正弦函数实现闪烁效果
                        const flashIntensity = Math.sin(this.clearAnimationProgress * Math.PI);
                        
                        // 添加白色闪光覆盖层
                        this.ctx.save();
                        this.ctx.globalAlpha = flashIntensity * 0.8;
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
                        this.ctx.restore();
                    } else {
                        // 普通绘制
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
        }
        
        // 绘制下落动画中的方块
        if (this.fallingBlocks.length > 0) {
            const timestamp = performance.now();
            this.fallingBlocks.forEach(block => {
                const elapsed = timestamp - block.startTime - block.delay;
                
                if (elapsed >= 0) {
                    const progress = Math.min(elapsed / block.duration, 1);
                    
                    // 使用缓动函数让下落更自然
                    const easeProgress = 1 - Math.pow(1 - progress, 3); // 缓出立方
                    
                    const currentY = block.originalRow + (block.targetRow - block.originalRow) * easeProgress;
                    
                    this.drawBlock(
                        this.ctx,
                        block.col * this.blockSize,
                        currentY * this.blockSize,
                        block.color,
                        this.blockSize
                    );
                } else {
                    // 延迟期间，在原始位置绘制
                    this.drawBlock(
                        this.ctx,
                        block.col * this.blockSize,
                        block.originalRow * this.blockSize,
                        block.color,
                        this.blockSize
                    );
                }
            });
        }
        
        // 绘制当前方块（动画期间不绘制）
        if (this.currentPiece && !this.isAnimating) {
            const shape = this.currentPiece.shape;
            const bombPositions = this.currentPiece.bombPositions || [];
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        // 检查是否是炸弹位置
                        const isBomb = bombPositions.some(pos => pos.row === row && pos.col === col);
                        const color = isBomb ? this.bombColor : this.currentPiece.color;
                        
                        this.drawBlock(
                            this.ctx,
                            (this.currentPiece.x + col) * this.blockSize,
                            (this.currentPiece.y + row) * this.blockSize,
                            color,
                            this.blockSize
                        );
                        
                        // 如果是炸弹，添加额外的视觉效果（中心圆点）
                        if (isBomb) {
                            const centerX = (this.currentPiece.x + col) * this.blockSize + this.blockSize / 2;
                            const centerY = (this.currentPiece.y + row) * this.blockSize + this.blockSize / 2;
                            this.ctx.fillStyle = '#ffffff';
                            this.ctx.beginPath();
                            this.ctx.arc(centerX, centerY, this.blockSize / 5, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }
            }
            
            // 绘制幽灵方块（预览落点）
            this.drawGhostPiece();
        }
        
        // 绘制爆炸特效
        this.drawExplosionEffects();
    }
    
    // 绘制爆炸特效
    drawExplosionEffects() {
        const timestamp = performance.now();
        
        this.explosionEffects.forEach(effect => {
            const progress = (timestamp - effect.startTime) / effect.duration;
            
            if (progress >= 0 && progress <= 1) {
                // 计算当前半径（从0到maxRadius）
                const radius = effect.maxRadius * progress;
                
                // 计算透明度（从1到0）
                const alpha = 1 - progress;
                
                // 绘制扩散的圆形闪光
                const centerX = (effect.x + 0.5) * this.blockSize;
                const centerY = (effect.y + 0.5) * this.blockSize;
                
                // 保存状态
                this.ctx.save();
                
                // 绘制外圈（白色高亮）
                this.ctx.globalAlpha = alpha * 0.8;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制内圈（橙色火焰效果）
                this.ctx.globalAlpha = alpha * 0.6;
                this.ctx.fillStyle = '#ff6600';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制中心（黄色核心）
                this.ctx.globalAlpha = alpha * 0.4;
                this.ctx.fillStyle = '#ffff00';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 恢复状态
                this.ctx.restore();
            }
        });
    }
    
    // 绘制幽灵方块（预览落点）
    drawGhostPiece() {
        if (!this.showGhostPiece) return;
        
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
        const blockSize = 20;
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
    
    // 绘制 Hold 区域方块
    drawHoldPiece() {
        this.holdCtx.fillStyle = '#2c3e50';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const shape = this.holdPiece.shape;
        const blockSize = 20;
        const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;
        
        // 如果 Hold 功能不可用，添加半透明效果
        this.holdCtx.globalAlpha = this.canHold ? 1 : 0.5;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(
                        this.holdCtx,
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        this.holdPiece.color,
                        blockSize
                    );
                }
            }
        }
        
        this.holdCtx.globalAlpha = 1;
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
    
    // 暂存当前方块
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        // 保存当前方块的形状和颜色（重置位置）
        const pieceToHold = {
            shape: JSON.parse(JSON.stringify(this.currentPiece.shape)),
            color: this.currentPiece.color,
            x: Math.floor((this.cols - this.currentPiece.shape[0].length) / 2),
            y: 0,
            bombPositions: this.currentPiece.bombPositions ? [...this.currentPiece.bombPositions] : []
        };
        
        if (this.holdPiece === null) {
            // 如果 Hold 区域为空，将当前方块放入 Hold，然后取出下一个方块
            this.holdPiece = pieceToHold;
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            this.drawNextPiece();
        } else {
            // 如果 Hold 区域已有方块，交换当前方块和 Hold 方块
            const temp = pieceToHold;
            this.currentPiece = {
                shape: JSON.parse(JSON.stringify(this.holdPiece.shape)),
                color: this.holdPiece.color,
                x: Math.floor((this.cols - this.holdPiece.shape[0].length) / 2),
                y: 0,
                bombPositions: this.holdPiece.bombPositions ? [...this.holdPiece.bombPositions] : []
            };
            this.holdPiece = temp;
        }
        
        // 标记不能再使用 Hold，直到下一个方块落下
        this.canHold = false;
        this.drawHoldPiece();
    }
    
    // 锁定方块
    lockPiece() {
        this.fixPiece();
        this.checkLines();
        
        // 生成新方块
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generatePiece();
        this.drawNextPiece();
        
        // 重置 Hold 功能可用性
        this.canHold = true;
        
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
        // P 键用于暂停/继续，游戏结束时也可以处理（如果需要重新开始）
        if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            // 只有在游戏进行中（不是游戏结束）才能暂停/继续
            if (!this.gameOver) {
                this.togglePause();
            }
            return;
        }
        
        // 暂停期间屏蔽其他键盘输入，游戏结束或没有当前方块时也屏蔽
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
        
        if (e.code === 'KeyC') {
            e.preventDefault();
            this.holdCurrentPiece();
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
        
        // 如果正在播放动画，只处理动画更新和绘制
        if (this.isAnimating) {
            // 更新爆炸特效
            this.updateExplosionEffects(timestamp);
            
            // 更新下落动画
            this.updateFallingAnimation(timestamp);
            
            // 更新消行动画
            this.updateClearAnimation(timestamp);
            
            // 绘制（包括特效）
            this.drawBoard();
            
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
        
        // 检查是否需要插入砖块
        this.checkInsertLine();
        
        this.gameLoop = requestAnimationFrame((t) => this.gameLoopFunction(t));
    }
    
    // 开始游戏
    startGame() {
        this.initBoard();
        this.score = 0;
        this.level = 1;
        this.totalLinesCleared = 0;
        this.holdPiece = null;
        this.canHold = true;
        
        // 应用难度设置
        const diffConfig = this.difficulties[this.difficulty];
        this.baseDropSpeed = diffConfig.baseSpeed;
        this.dropSpeed = diffConfig.baseSpeed;
        this.scoreMultiplier = diffConfig.scoreMultiplier;
        this.insertLines = diffConfig.insertLines;
        this.insertInterval = diffConfig.insertInterval;
        this.lastInsertScore = 0;
        
        this.updateScore();
        this.updateHighScore();
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
        this.drawHoldPiece();
        
        // 开始游戏循环
        this.lastDropTime = 0;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.gameLoop = requestAnimationFrame((t) => this.gameLoopFunction(t));
    }
    
    // 从底部插入一行随机填充的砖块
    insertRandomLine() {
        // 生成新的一行，随机填充，中间留一个空格
        const newLine = [];
        const emptyCol = Math.floor(Math.random() * this.cols);
        
        for (let col = 0; col < this.cols; col++) {
            if (col === emptyCol) {
                newLine.push(null);
            } else {
                // 随机选择一种颜色
                const randomIndex = Math.floor(Math.random() * this.shapes.length);
                newLine.push(this.shapes[randomIndex].color);
            }
        }
        
        // 移除顶部一行，底部插入新行
        this.board.shift();
        this.board.push(newLine);
        
        // 检查游戏是否结束（如果插入后与当前方块碰撞）
        if (this.currentPiece && this.checkCollision(this.currentPiece)) {
            this.endGame();
        }
    }
    
    // 检查是否需要插入砖块
    checkInsertLine() {
        if (!this.insertLines || this.insertInterval <= 0) return;
        
        // 计算从上次插入后增加的分数
        const scoreSinceLastInsert = this.score - this.lastInsertScore;
        
        if (scoreSinceLastInsert >= this.insertInterval) {
            this.insertRandomLine();
            this.lastInsertScore = this.score;
        }
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
        
        // 检查是否是新纪录
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScore();
            this.newRecordElement.style.display = 'block';
        } else {
            this.newRecordElement.style.display = 'none';
        }
        
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

// 初始化最高分显示
game.updateHighScore();

// 绘制初始界面
game.drawBoard();
