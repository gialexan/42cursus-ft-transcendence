import { navigateTo } from '/static/js/Router.js';

// Game settings and configurations
const GAME_FONT = "SANS";

// Game mode options
const GAME_MODE = {
	FOUR_PLAYER: 'fourplayer'
};

const SETTINGS = {
	BACKGROUND_COLOR: 'black', // Background color of the canvas
	CANVAS_WIDTH: 800,
	CANVAS_HEIGHT: 800,
	PADDLE_WIDTH: 20,
	PADDLE_HEIGHT: 100,
	PADDLE_COLOR: 'white',
	BALL_COLOR: 'white',
	BALL_RADIUS: 10,
	INITIAL_BALL_SPEED: 3,
	MAX_BALL_SPEED: 10,
	BALL_SPEED_INCREASE: 0.05,
	PLAYER_SPEED: 10,
	GAME_MODE: GAME_MODE.FOUR_PLAYER, // 'single' or 'local'
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

// Key mappings for player movement
const CONTROLS = {
	WASD: { UP: 'W', DOWN: 'S' },
	ARROWS: { UP: 'ArrowUp', DOWN: 'ArrowDown' },
	AD: { LEFT: 'A', RIGHT: 'D'},
	LR: { LEFT: 'ArrowLeft', RIGHT: 'ArrowRight'}
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
	constructor(canvas, x, y, isHorizontal = false) {
		this.canvas = canvas;
		this.keyHandler = new KeyHandler();
		this.x = x;
		this.y = y;
		this.isHorizontal = isHorizontal;
		this.width = isHorizontal ? SETTINGS.PADDLE_HEIGHT : SETTINGS.PADDLE_WIDTH;
		this.height = isHorizontal ? SETTINGS.PADDLE_WIDTH : SETTINGS.PADDLE_HEIGHT;
		this.dx = 0;
		this.dy = 0;
		this.lastDx = 0;
		this.lastDy = 0;
	}

	move(upKey, downKey, leftKey, rightKey) {
		if (this.isHorizontal) {
			if (this.keyHandler.isKeyPressed(leftKey)) {
				this.dx = -SETTINGS.PLAYER_SPEED;
			} else if (this.keyHandler.isKeyPressed(rightKey)) {
				this.dx = SETTINGS.PLAYER_SPEED;
			} else {
				this.dx = 0;
			}

			this.x += this.dx;
			if (this.x < 0) this.x = 0;
			if (this.x + this.width > this.canvas.width) this.x = this.canvas.width - this.width;
			this.lastDx = this.dx;
		} else {
			if (this.keyHandler.isKeyPressed(upKey)) {
				this.dy = -SETTINGS.PLAYER_SPEED;
			} else if (this.keyHandler.isKeyPressed(downKey)) {
				this.dy = SETTINGS.PLAYER_SPEED;
			} else {
				this.dy = 0;
			}

			this.y += this.dy;
			if (this.y < 0) this.y = 0;
			if (this.y + this.height > this.canvas.height) this.y = this.canvas.height - this.height;
			this.lastDy = this.dy;
		}
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
	}
}

class Render {
	constructor(canvas) {
		this.canvas = canvas;
		// Ensures that font is loaded before rendering text in drawCountdown()
		this.font = new FontFaceObserver(GAME_FONT);
		this.context = canvas.getContext('2d');
	}

	drawGame(player1, player2, player3, player4, ball, players13Score, players24Score) {
		this.context.fillStyle = SETTINGS.BACKGROUND_COLOR;

		// Fill the canvas with background color
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this._drawNet();
		this._drawPaddle(player1);

		if (SETTINGS.GAME_MODE === GAME_MODE.FOUR_PLAYER) {
			this._drawPaddle(player2);
			this._drawPaddle(player3);
			this._drawPaddle(player4);
		}

		this._drawBall(ball);
		this._drawScores(players13Score, players24Score);
	}

	resetBall(ball) {
		ball.x = this.canvas.width / 2;
		ball.y = this.canvas.height / 2;
		ball.speed = SETTINGS.INITIAL_BALL_SPEED;
		ball.dx =
			SETTINGS.INITIAL_BALL_SPEED *(Math.random() < 0.5 ? -1 : 1);
		ball.dy =
			SETTINGS.INITIAL_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1);
	}

    // TODO : Estava dando erro de fonte, deixamos valores fixos para não ter problema
    drawCountdown(count) {
        this.context.font = '48px "Open Sans"';
        this.context.fillStyle = '#000000'; // Defina a cor de fundo aqui
        // Fill the canvas with background color
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = '#FFFFFF'; // Defina a cor do texto aqui
        this.context.textAlign = 'center'; // Defina o alinhamento do texto aqui
        this.context.fillText(
            count > 0 ? `${count}` : 'GO!',
            this.canvas.width / 2, this.canvas.height / 2
        );
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

	_drawScores(players13Score, players24Score) {
		this.context.font = SETTINGS.SCOREBOARD_FONT;
		this.context.fillStyle = SETTINGS.SCOREBOARD_STYLE;
		this.context.textAlign = SETTINGS.SCOREBOARD_ALIGN;
		this.context.fillText(
			players13Score.toString(), this.canvas.width * 0.25, 50);
		this.context.fillText(
			players24Score.toString(), this.canvas.width * 0.75, 50);
	}

	_drawNet() {
		this.context.strokeStyle = SETTINGS.NET_COLOR;
		this.context.lineWidth = SETTINGS.NET_WIDTH;
		this.context.setLineDash(
			[SETTINGS.NET_DASH_LENGTH, SETTINGS.NET_GAP_LENGTH]);
		this.context.beginPath();
		this.context.moveTo(0, 0);
		this.context.lineTo(this.canvas.width, this.canvas.height);
		this.context.moveTo(this.canvas.width, 0);
		this.context.lineTo(0, this.canvas.height);
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
		this.player1 = new Player(canvas, 10, (canvas.height - SETTINGS.PADDLE_HEIGHT) / 2);
		this.player2 = new Player(canvas, canvas.width - SETTINGS.PADDLE_WIDTH - 10, (canvas.height - SETTINGS.PADDLE_HEIGHT) / 2);
		this.player3 = new Player(canvas, (canvas.width - SETTINGS.PADDLE_HEIGHT) / 2, 10, true);
		this.player4 = new Player(canvas, (canvas.width - SETTINGS.PADDLE_HEIGHT) / 2, canvas.height - SETTINGS.PADDLE_WIDTH - 10, true);
		this.players13Score = 0;
		this.players24Score = 0;
		this.isGameRunning = false;
		this.isGamePaused = false;

		document.getElementById('restartGameButton').addEventListener('click', () => {
            this.restartGame();
        });
	}

	start() {
		// Increase speed every second
		setInterval(() => this._increaseBallSpeed(), SETTINGS.COUNTDOWN_INTERVAL);
		this._startCountdown();
	}

	_increaseBallSpeed() {
		if (Math.abs(this.ball.dx) < SETTINGS.MAX_BALL_SPEED) {
			this.ball.dx += Math.sign(this.ball.dx) * SETTINGS.BALL_SPEED_INCREASE;
		}
		if (Math.abs(this.ball.dy) < SETTINGS.MAX_BALL_SPEED) {
			this.ball.dy += Math.sign(this.ball.dy) * SETTINGS.BALL_SPEED_INCREASE;
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
        const winner = this.player13Score > this.player24Score ? 'Player 1' : 'Player 2';
        const gameOverModal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        document.querySelector('#gameOverModal .modal-body').innerText = `${winner} wins!`;
        gameOverModal.show();

        this.isGameRunning = false;
        this.isGamePaused = true;

        // Adiciona event listeners para os botões do modal
        document.getElementById('endGameButton').addEventListener('click', () => {
            this._handleEndGame();
        });

        document.getElementById('restartGameButton').addEventListener('click', () => {
            console.log("restartGameButton - restartando o jogo")
        });

    }

	_handleEndGame() {
        // Lógica para finalizar o jogo
        console.log('Game ended 1');
        navigateTo("/dashboard");

        // Outras ações necessárias para finalizar o jogo
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
				this.player1, this.player2, this.player3, this.player4, this.ball,
				this.players13Score, this.players24Score);
			requestAnimationFrame(() => this._gameLoop());
		}
	}

	_update() {
		if (!this.isGameRunning || this.isGamePaused) return;

		if (SETTINGS.GAME_MODE === GAME_MODE.FOUR_PLAYER) {
			this.player1.move(CONTROLS.WASD.UP, CONTROLS.WASD.DOWN, null, null);
			this.player2.move(CONTROLS.ARROWS.UP, CONTROLS.ARROWS.DOWN, null, null);
			this.player3.move(null, null, CONTROLS.LR.LEFT, CONTROLS.LR.RIGHT);
			this.player4.move(null, null, CONTROLS.AD.LEFT, CONTROLS.AD.RIGHT);
		}

		this.ball.move();
		this._checkCollisions();
		this._checkScore();
		this._checkWin();

		// Reset the ball if it goes out of bounds
		if (
			this.ball.x < 0 || 
			this.ball.x > this.canvas.width || 
			this.ball.y < this.ball.radius || 
			this.ball.y > this.canvas.height - this.ball.radius
		) {
			this.render.resetBall(this.ball);
		}
	}

	_checkCollisions() {
		// Player1 paddle collision
		if (this._isBallPaddleCollision(this.player1)) {
			this._handlePaddleCollision(this.player1);
		}

		if (SETTINGS.GAME_MODE === GAME_MODE.FOUR_PLAYER) {
			if (this._isBallPaddleCollision(this.player2)) {
				this._handlePaddleCollision(this.player2);
			}
			if (this._isBallPaddleCollision(this.player3)) {
				this._handlePaddleCollision(this.player3);
			}
			if (this._isBallPaddleCollision(this.player4)) {
				this._handlePaddleCollision(this.player4);
			}
		}
	}

	_isBallPaddleCollision(paddle) {
		if (paddle.isHorizontal) {
			return (
				this.ball.x > paddle.x &&
				this.ball.x < paddle.x + paddle.width &&
				this.ball.y - this.ball.radius < paddle.y + paddle.height &&
				this.ball.y + this.ball.radius > paddle.y
			);
		} else {
			return (
				this.ball.x - this.ball.radius < paddle.x + paddle.width &&
				this.ball.x + this.ball.radius > paddle.x &&
				this.ball.y > paddle.y &&
				this.ball.y < paddle.y + paddle.height
			);
		}
	}

	_handlePaddleCollision(paddle) {
		if (paddle.isHorizontal) {
			this.ball.dy *= -1;
			if (paddle === this.player3) {
				this.ball.y = paddle.y + paddle.height + this.ball.radius;
				this.ball.dx += paddle.lastDx * 0.2;
			} else {
				this.ball.y = paddle.y - this.ball.radius;
				this.ball.dx += paddle.lastDx * 0.2;
			}
		} else {
			this.ball.dx *= -1;
			if (paddle === this.player1) {
				this.ball.x = paddle.x + paddle.width + this.ball.radius;
				this.ball.dy += paddle.lastDy * 0.2;
			} else {
				this.ball.x = paddle.x - this.ball.radius;
				this.ball.dy += paddle.lastDy * 0.2;
			}
		}
	}

	_checkScore() {
		if (this.ball.x < 0) {
			this.players24Score++; // Player 2 scores
		} else if (this.ball.x > this.canvas.width) {
			this.players13Score++; // Player 1 scores
		} else if (this.ball.y < this.ball.radius) {
			this.players13Score++; // Player 3 scores
		} else if (this.ball.y > this.canvas.height - this.ball.radius) {
			this.players24Score++; // Player 4 scores
		}
	}

	_checkWin() {
		if (
			this.players13Score >= SETTINGS.WINNING_SCORE ||
			this.players24Score >= SETTINGS.WINNING_SCORE) {
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
