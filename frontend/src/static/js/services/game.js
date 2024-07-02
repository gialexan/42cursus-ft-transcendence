// Game settings and configurations
const GAME_FONT = 'Press Start 2P';

// Game mode options
const GAME_MODE = {
    TRAINING: 'wall',
    SOLO_PLAYER: 'single',
    LOCAL_PVP: 'local'
};

const SETTINGS = {
    BACKGROUND_COLOR: 'black', // Background color of the canvas
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PADDLE_WIDTH: 20,
    PADDLE_HEIGHT: 100,
    PADDLE_COLOR: 'white',
    BALL_COLOR: 'white',
    BALL_RADIUS: 10,
    INITIAL_BALL_SPEED: 3,
    MAX_BALL_SPEED: 10,
    BALL_SPEED_INCREASE: 0.05,
    PLAYER_SPEED: 10,
    GAME_MODE: GAME_MODE.SOLO_PLAYER, // 'single' or 'local'
    AI_DIFFICULTY: 'medium', // 'easy', 'medium', 'hard', 'legend'
    AI_TIME_STEPS: 0.01667, // Considering 60 fps
    WINNING_SCORE: 3, // Define winning score
    COUNTDOWN_TIME: 3, // Countdown time in seconds
    COUNTDOWN_FONT: `50px "${GAME_FONT}"`,
    COUNTDOWN_STYLE: 'white',
    COUNTDOWN_ALIGN: 'center',
    COUNTDOWN_MESSAGE: 'GO!',
    // In milliseconds, the interval for which the ball speed increases
    COUNTDOWN_INTERVAL: 1000,
    SCOREBOARD_FONT: `30px "${GAME_FONT}"`,
    SCOREBOARD_STYLE: 'white',
    SCOREBOARD_ALIGN: 'center',
    NET_COLOR: 'white',
    NET_WIDTH: 5,
    NET_GAP_LENGTH: 10, // Length of the gap between dashes
    NET_DASH_LENGTH: 10 // Length of the dash
};

// AI settings based on difficulty levels
const AI_SETTINGS = {
    easy: { burden: 0, reactionTime: 0.99, foretellTime: 1000 },
    medium: { burden: 1.5, reactionTime: 0.7, foretellTime: 100 },
    hard: { burden: 0.5, reactionTime: 0.8, foretellTime: 10 },
    legend: { burden: 0, reactionTime: 0.99, foretellTime: 0.1 }
}

// This const is a utility to convert milliseconds to seconds
// It is used in Kalman algorithm
const MS_TO_S = 1000;

// Key mappings for player movement
const CONTROLS = {
    WASD: { UP: 'W', DOWN: 'S' },
    ARROWS: { UP: 'ArrowUp', DOWN: 'ArrowDown' }
};

// KeyHandler class to handle keyboard inputs
class KeyHandler {
    constructor() {
        this.keys = {};
        document.addEventListener(
            'keydown', event => this.keys[event.key.toUpperCase()] = true);
        document.addEventListener(
            'keyup', event => this.keys[event.key.toUpperCase()] = false);
    }

    isKeyPressed(key) {
        return this.keys[key.toUpperCase()];
    }
}

// Player class to represent each player
class Player {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.keyHandler = new KeyHandler();
        this.x = x;
        this.y = y;
        this.width = SETTINGS.PADDLE_WIDTH;
        this.height = SETTINGS.PADDLE_HEIGHT;
        this.dy = 0;
        this.lastDy = 0;
    }

    move(wKey, sKey, upKey, downKey) {
        if ((upKey !== null && this.keyHandler.isKeyPressed(upKey))
            || (wKey !== null && this.keyHandler.isKeyPressed(wKey))) {
            this.dy = -SETTINGS.PLAYER_SPEED;
        } else if ((downKey !== null && this.keyHandler.isKeyPressed(downKey))
            || (sKey !== null && this.keyHandler.isKeyPressed(sKey))) {
            this.dy = SETTINGS.PLAYER_SPEED;
        } else {
            this.dy = 0;
        }

        this.y += this.dy;
        if (this.y < 0)
            this.y = 0;
        if (this.y + this.height > this.canvas.height)
            this.y = this.canvas.height - this.height;

        this.lastDy = this.dy;
    }
}

// AI using Kalman algorithm
class AI extends Player {
    constructor(canvas, ball, x, y) {
        super(canvas, x, y);
        this.burden = AI_SETTINGS[SETTINGS.AI_DIFFICULTY].burden;
        this.reactionTime = AI_SETTINGS[SETTINGS.AI_DIFFICULTY].reactionTime;
        this.foretellTime = AI_SETTINGS[SETTINGS.AI_DIFFICULTY].foretellTime;
        this.targetY = y;
        this.ball = ball;
        this.timeStep = SETTINGS.AI_TIME_STEPS;

        // Initialize state and Kalman filter parameters
        this.state = {
            x: ball.x,
            y: ball.y,
            dx: ball.dx,
            dy: ball.dy
        };

        this._initKalmanParams();
        this._predictBallPosition();
    }

    _initKalmanParams() {
        this.P = Matrix.P_MATRIX;

        this.F = [
            [1, 0, this.timeStep, 0],
            [0, 1, 0, this.timeStep],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]; // State transition matrix

        this.H = Matrix.H_MATRIX;
        this.R = Matrix.R_MATRIX;
        this.Q = Matrix.Q_MATRIX;
    }

    _predictBallPosition() {
        // Prediction step
        let statePred = Matrix.matrixMultiply(
            this.F, [[this.state.x], [this.state.y],
            [this.state.dx], [this.state.dy]]);
        let PPred = Matrix.matrixAdd(
            Matrix.matrixMultiply(Matrix.matrixMultiply(
                this.F, this.P), Matrix.transpose(this.F)), this.Q);

        // Handle wall bounces in the prediction
        let futureY = statePred[1][0];
        if (futureY < this.ball.radius || futureY
            > this.canvas.height - this.ball.radius) {
            statePred[3][0] = -statePred[3][0]; // Reverse dy
        }

        // Handle paddle bounces in the prediction
        let futureX = statePred[0][0];
        if ((futureX - this.ball.radius < this.x + this.width
            && statePred[2][0] < 0) || (futureX + this.ball.radius
                > this.x && statePred[2][0] > 0)) {
            statePred[2][0] = -statePred[2][0]; // Reverse dx
        }

        // Update step
        let Z = [[this.ball.x], [this.ball.y]];
        let y = Matrix.matrixSubtract(Z, Matrix.matrixMultiply(this.H, statePred));
        let S = Matrix.matrixAdd(
            Matrix.matrixMultiply(
                Matrix.matrixMultiply(
                    this.H, PPred), Matrix.transpose(this.H)), this.R);
        let K = Matrix.matrixMultiply(
            Matrix.matrixMultiply(
                PPred, Matrix.transpose(this.H)), Matrix.inverse(S));
        let stateUpdated = Matrix.matrixAdd(statePred, Matrix.matrixMultiply(K, y));
        let PUpdated = Matrix.matrixSubtract(
            PPred, Matrix.matrixMultiply(Matrix.matrixMultiply(K, this.H), PPred));

        this.state = {
            x: stateUpdated[0][0],
            y: stateUpdated[1][0],
            dx: stateUpdated[2][0],
            dy: stateUpdated[3][0]
        };
        this.P = PUpdated;

        // Predict future position
        let futureTime = this.foretellTime / MS_TO_S; // 1 second into the future
        this.targetY =
            this.state.y + this.state.dy * futureTime - this.height / 2;

        // Schedule the next prediction
        setTimeout(() => this._predictBallPosition(), this.foretellTime);
    }

    move(ball) {
        this.ball = ball;
        const dy = (this.targetY - this.y) * this.reactionTime;

        // Limit the movement to SETTINGS.PLAYER_SPEED
        if (Math.abs(dy) > SETTINGS.PLAYER_SPEED) {
            this.y += Math.sign(dy) * (SETTINGS.PLAYER_SPEED - this.burden);
        } else {
            this.y += dy;
        }

        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.canvas.height)
            this.y = this.canvas.height - this.height;

        this._simulateKeyPress();
    }

    _simulateKeyPress() {
        // Simulate key press based on AI's current position
        if (this.targetY < this.y) {
            this.keyHandler.keys['ArrowUp'] = true;
            this.keyHandler.keys['ArrowDown'] = false;
        } else if (this.targetY > this.y) {
            this.keyHandler.keys['ArrowUp'] = false;
            this.keyHandler.keys['ArrowDown'] = true;
        } else {
            this.keyHandler.keys['ArrowUp'] = false;
            this.keyHandler.keys['ArrowDown'] = false;
        }
    }
}

class Matrix {
    static get P_MATRIX() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]; // State transition matrix
    }

    static get H_MATRIX() {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ]; // Observation matrix
    }

    static get Q_MATRIX() {
        return [
            [0.1, 0, 0, 0],
            [0, 0.1, 0, 0],
            [0, 0, 0.1, 0],
            [0, 0, 0, 0.1]
        ]; // Process noise covariance
    }

    static get R_MATRIX() {
        return [
            [0.01, 0],
            [0, 0.01]
        ]; // Observation noise covariance
    }

    // Utility functions for matrix operations
    static matrixMultiply(A, B) {
        let result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < B[0].length; j++) {
                for (let k = 0; k < B.length; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    }

    static matrixAdd(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }

    static matrixSubtract(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }

    static transpose(A) {
        return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
    }

    static inverse(A) {
        // This function assumes A is a 2x2 matrix.
        let det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        return [
            [A[1][1] / det, -A[0][1] / det],
            [-A[1][0] / det, A[0][0] / det]
        ];
    }
}

// Ball class to represent the game ball
class Ball {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = SETTINGS.BALL_RADIUS;
        this.speed = SETTINGS.INITIAL_BALL_SPEED;
        this.dx = SETTINGS.INITIAL_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1);
        this.dy = SETTINGS.INITIAL_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1);
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.y < this.radius || this.y > this.canvas.height - this.radius) {
            this.dy *= -1;
        }
    }
}

class Render {
    constructor(canvas) {
        this.canvas = canvas;
        // Ensures that font is loaded before rendering text in drawCountdown()
        this.font = new FontFaceObserver(GAME_FONT);
        this.context = canvas.getContext('2d');
    }

    drawGame(player1, player2, ai, ball, player1Score, player2Score) {
        this.context.fillStyle = SETTINGS.BACKGROUND_COLOR;

        // Fill the canvas with background color
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawNet();
        this._drawPaddle(player1);

        if (SETTINGS.GAME_MODE === GAME_MODE.TRAINING) {
            this._drawPaddleAsWall();
        } else if (SETTINGS.GAME_MODE === GAME_MODE.SOLO_PLAYER) {
            this._drawPaddle(ai);
        } else if (SETTINGS.GAME_MODE === GAME_MODE.LOCAL_PVP) {
            this._drawPaddle(player2);
        }

        this._drawBall(ball);
        this._drawScores(player1Score, player2Score);
    }

    resetBall(ball) {
        ball.x = this.canvas.width / 2;
        ball.y = this.canvas.height / 2;
        ball.speed = SETTINGS.INITIAL_BALL_SPEED;
        ball.dx =
            SETTINGS.INITIAL_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1);
        ball.dy =
            SETTINGS.INITIAL_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1);
    }

    drawCountdown(count) {
        this.font.load().then(() => {
            this.context.font = SETTINGS.COUNTDOWN_FONT;
            this.context.fillStyle = SETTINGS.BACKGROUND_COLOR;
            // Fill the canvas with background color
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = SETTINGS.COUNTDOWN_STYLE;
            this.context.textAlign = SETTINGS.COUNTDOWN_ALIGN;
            this.context.fillText(
                count > 0 ? `${count}` : SETTINGS.COUNTDOWN_MESSAGE,
                this.canvas.width / 2, this.canvas.height / 2);
        });
    }

    _drawBall(ball) {
        this.context.beginPath();
        this.context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.context.fillStyle = SETTINGS.BALL_COLOR;
        this.context.fill();
        this.context.closePath();
    }

    _drawPaddle(player) {
        this.context.fillStyle = SETTINGS.PADDLE_COLOR;
        this.context.fillRect(player.x, player.y, player.width, player.height);
    }

    _drawPaddleAsWall() {
        this.context.fillStyle = SETTINGS.PADDLE_COLOR;
        this.context.fillRect(
            this.canvas.width - SETTINGS.PADDLE_WIDTH - 10,
            0,
            SETTINGS.PADDLE_WIDTH,
            this.canvas.height
        );
    }

    _drawScores(player1Score, player2Score) {
        this.context.font = SETTINGS.SCOREBOARD_FONT;
        this.context.fillStyle = SETTINGS.SCOREBOARD_STYLE;
        this.context.textAlign = SETTINGS.SCOREBOARD_ALIGN;

        if (SETTINGS.GAME_MODE === GAME_MODE.TRAINING) {
            this.context.fillText(
                `You | ${player1Score.toString()}`, this.canvas.width * 0.25, 50);
            this.context.fillText(
                `WALL | ${player2Score.toString()}`, this.canvas.width * 0.75, 50);
        } else if (SETTINGS.GAME_MODE === GAME_MODE.SOLO_PLAYER) {
            // User vs AI mode
            this.context.fillText(
                `You | ${player1Score.toString()}`, this.canvas.width * 0.25, 50);
            this.context.fillText(
                `SKYNET | ${player2Score.toString()}`, this.canvas.width * 0.75, 50);
        } else if (SETTINGS.GAME_MODE === GAME_MODE.LOCAL_PVP) {
            // Player 1 vs Player 2 mode
            this.context.fillText(
                `Player 1: ${player1Score.toString()}`, this.canvas.width * 0.25, 50);
            this.context.fillText(
                `Player 2: ${player2Score.toString()}`, this.canvas.width * 0.75, 50);
        }
    }

    _drawNet() {
        this.context.strokeStyle = SETTINGS.NET_COLOR;
        this.context.lineWidth = SETTINGS.NET_WIDTH;
        this.context.setLineDash(
            [SETTINGS.NET_DASH_LENGTH, SETTINGS.NET_GAP_LENGTH]);
        this.context.beginPath();
        this.context.moveTo(this.canvas.width / 2, 0);
        this.context.lineTo(this.canvas.width / 2, this.canvas.height);
        this.context.stroke();
        // Reset to solid lines for other drawings
        this.context.setLineDash([]);
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ball = new Ball(canvas);
        this.render = new Render(canvas);
        this.player1 = new Player(canvas, 10,
            (canvas.height - SETTINGS.PADDLE_HEIGHT) / 2);
        this.player2 = new Player(canvas,
            canvas.width - SETTINGS.PADDLE_WIDTH - 10,
            (canvas.height - SETTINGS.PADDLE_HEIGHT) / 2);
        this.ai = new AI(canvas, this.ball,
            canvas.width - SETTINGS.PADDLE_WIDTH - 10,
            (canvas.height - SETTINGS.PADDLE_HEIGHT) / 2);
        this.player1Score = 0;
        this.player2Score = 0;
        this.isGameRunning = false;
        this.isGamePaused = false;

        document.getElementById('restartGameButton').addEventListener('click', () => {
            this.restartGame();
        });
    }

    start() {
        // Increase speed every second
        setInterval(
            () => this._increaseBallSpeed(), SETTINGS.COUNTDOWN_INTERVAL);
        this._startCountdown();
        this._addTouchControls();  // Add touch controls when the game starts
    }

    _increaseBallSpeed() {
        if (Math.abs(this.ball.dx) < SETTINGS.MAX_BALL_SPEED) {
            this.ball.dx +=
                Math.sign(this.ball.dx) * SETTINGS.BALL_SPEED_INCREASE;
        }
        if (Math.abs(this.ball.dy) < SETTINGS.MAX_BALL_SPEED) {
            this.ball.dy +=
                Math.sign(this.ball.dy) * SETTINGS.BALL_SPEED_INCREASE;
        }
    }

    /**
     * This method displays a modal with the winner's name
     * and resets the game state.
     *
     * @private
     * @memberof Game
     * @returns {void}
     *
     */
    _endGame() {
        const winner = this.player1Score > this.player2Score ? 'Player 1' : 'Player 2';
        const gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        document.querySelector('#gameOverModal .modal-body').innerText = `${winner} wins!`;
        gameOverModal.show();

        this.isGameRunning = false;
        this.isGamePaused = true;
    }

    /**
     * This method restarts the game by resetting the scores,
     * ball position, and starting the countdown.
     *
     * @memberof Game
     * @returns {void}
     *
    */
    restartGame() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.isGamePaused = false;
        this.render.resetBall(this.ball);
        this._startCountdown();
    }

    _startCountdown() {
        let count = SETTINGS.COUNTDOWN_TIME;
        const COUNTDOWN_INTERVAL = setInterval(() => {
            this.render.drawCountdown(count);
            if (count === -1) {
                clearInterval(COUNTDOWN_INTERVAL);
                this.isGameRunning = true;
                this._gameLoop();
            }
            count--;
        }, SETTINGS.COUNTDOWN_INTERVAL);
    }

    _gameLoop() {
        if (this.isGameRunning) {
            this._update();
            this.render.drawGame(
                this.player1, this.player2, this.ai, this.ball,
                this.player1Score, this.player2Score);
            requestAnimationFrame(() => this._gameLoop());
        }
    }

    _update() {
        if (!this.isGameRunning || this.isGamePaused) return;

        if (SETTINGS.GAME_MODE === GAME_MODE.TRAINING) {
            this.player1.move(CONTROLS.WASD.UP,
                CONTROLS.WASD.DOWN, CONTROLS.ARROWS.UP, CONTROLS.ARROWS.DOWN);
        } else if (SETTINGS.GAME_MODE === GAME_MODE.SOLO_PLAYER) {
            this.player1.move(CONTROLS.WASD.UP,
                CONTROLS.WASD.DOWN, CONTROLS.ARROWS.UP, CONTROLS.ARROWS.DOWN);
            this.ai.move(this.ball);
        } else if (SETTINGS.GAME_MODE === GAME_MODE.LOCAL_PVP) {
            this.player1.move(
                CONTROLS.WASD.UP, CONTROLS.WASD.DOWN, null, null);
            this.player2.move(
                null, null, CONTROLS.ARROWS.UP, CONTROLS.ARROWS.DOWN);
        }

        this.ball.move();
        this._checkCollisions();
        this._checkScore();
        this._checkWin();

        // Reset ball if out of bounds
        if (this.ball.x < 0 || this.ball.x > this.canvas.width) {
            this.render.resetBall(this.ball);
        }
    }

    _checkCollisions() {
        // Player1 paddle collision
        if (this._isBallPaddleCollision(this.player1)) {
            this._handlePaddleCollision(this.player1);
        }

        // Player2 or AI paddle collision
        if (SETTINGS.GAME_MODE === GAME_MODE.TRAINING) {
            if (this._isBallWallCollision()) {
                this._handleWallCollision();
            }
        } else if (SETTINGS.GAME_MODE === GAME_MODE.SOLO_PLAYER) {
            if (this._isBallPaddleCollision(this.ai)) {
                this._handlePaddleCollision(this.ai);
            }
        } else if (SETTINGS.GAME_MODE === GAME_MODE.LOCAL_PVP) {
            if (this._isBallPaddleCollision(this.player2)) {
                this._handlePaddleCollision(this.player2);
            }
        }
    }

    _isBallWallCollision() {
        return this.ball.x + this.ball.radius >
            this.canvas.width - 10 - SETTINGS.PADDLE_WIDTH;
    }

    _handleWallCollision() {
        this.ball.dx *= -1;
        this.ball.x = this.canvas.width - 10 - SETTINGS.PADDLE_WIDTH - this.ball.radius;
        // Adjust ball's y position to stay within canvas height
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
        } else if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
        }
    }

    _isBallPaddleCollision(paddle) {
        return (
            this.ball.x - this.ball.radius < paddle.x + paddle.width &&
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y > paddle.y &&
            this.ball.y < paddle.y + paddle.height
        );
    }

    _handlePaddleCollision(paddle) {
        this.ball.dx *= -1;
        if (paddle === this.player1) {
            this.ball.x = paddle.x + paddle.width + this.ball.radius;
            this.ball.dy += paddle.lastDy * 0.2;
        } else {
            this.ball.x = paddle.x - this.ball.radius;
            this.ball.dy += paddle.lastDy * 0.2;
        }
    }

    _checkScore() {
        if (this.ball.x < 0) {
            this.player2Score++;
        } else if (this.ball.x > this.canvas.width) {
            this.player1Score++;
        }
    }

    _checkWin() {
        if (this.player1Score >= SETTINGS.WINNING_SCORE ||
            this.player2Score >= SETTINGS.WINNING_SCORE) {
            this._endGame();
        }
    }
}

function main() {
    // Initialize canvas, i.e., 2D pong table's width and height
    const canvas = document.getElementById('gameCanvas');
    canvas.width = SETTINGS.CANVAS_WIDTH;
    canvas.height = SETTINGS.CANVAS_HEIGHT;

    const game = new Game(canvas);

    // Start the game
    game.start();
}

export { main };
