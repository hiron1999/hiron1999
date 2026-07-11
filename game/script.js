const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game State
let gameActive = false;
let score = 0;
let hp = 100;
let keys = {};
let particles = [];
let stars = [];
let lasers = [];
let bugs = [];

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const hpFill = document.getElementById('hp-fill');

const bugTypes = [
    { text: 'NPE', color: '#ff00ff', hp: 1 },
    { text: 'OOM', color: '#ff3300', hp: 2 },
    { text: '404', color: '#ff0055', hp: 1 },
    { text: 'DEADLOCK', color: '#e6007e', hp: 3 }
];

class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2;
        this.y = canvas.height - 60;
        this.speed = 6;
        this.color = '#00ffff';
        this.cooldown = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Ship glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Thruster
        ctx.beginPath();
        ctx.moveTo(-10, this.height / 2);
        ctx.lineTo(10, this.height / 2);
        ctx.lineTo(0, this.height / 2 + 15 + Math.random() * 10);
        ctx.closePath();
        ctx.fillStyle = '#ff00ff';
        ctx.fill();

        ctx.restore();
    }

    update() {
        if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['s']) this.y += this.speed;

        // Boundaries
        this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(canvas.height - this.height/2, this.y));

        if (this.cooldown > 0) this.cooldown--;

        if ((keys[' '] || keys['Enter']) && this.cooldown === 0) {
            this.shoot();
        }
    }

    shoot() {
        lasers.push(new Laser(this.x, this.y - this.height/2));
        this.cooldown = 15;
    }
}

class Laser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 20;
        this.speed = 10;
        this.color = '#00ffff';
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        ctx.restore();
    }

    update() {
        this.y -= this.speed;
    }
}

class Bug {
    constructor() {
        this.type = bugTypes[Math.floor(Math.random() * bugTypes.length)];
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -30;
        this.width = 60;
        this.height = 30;
        this.speed = 1 + Math.random() * 2 + (score * 0.001);
        this.hp = this.type.hp;
        this.maxHp = this.type.hp;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.type.color;
        
        ctx.fillStyle = '#0a0715';
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        ctx.fillStyle = this.type.color;
        ctx.font = '12px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.text, 0, 0);

        // HP indicator
        if(this.maxHp > 1) {
             ctx.fillStyle = '#fff';
             ctx.shadowBlur = 0;
             ctx.fillRect(-this.width/2, -this.height/2 - 6, this.width * (this.hp / this.maxHp), 3);
        }

        ctx.restore();
    }

    update() {
        this.y += this.speed;
        // Wobble
        this.x += Math.sin(Date.now() / 300) * 1.5;
        this.x = Math.max(this.width/2, Math.min(canvas.width - this.width/2, this.x));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 3 + 0.5;
        this.color = Math.random() > 0.5 ? '#ffffff' : '#00ffff';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    update() {
        this.y += this.speed + (gameActive ? 2 : 0);
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
}

let player;
let spawnTimer = 0;

function init() {
    for (let i = 0; i < 100; i++) stars.push(new Star());
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function startGame() {
    gameActive = true;
    score = 0;
    hp = 100;
    player = new Player();
    bugs = [];
    lasers = [];
    particles = [];
    scoreEl.innerText = score;
    hpFill.style.width = '100%';
    hpFill.style.background = '#00ffff';
    hpFill.style.boxShadow = '0 0 10px #00ffff';
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    animate();
}

function gameOver() {
    gameActive = false;
    finalScoreEl.innerText = score;
    gameOverScreen.classList.add('active');
}

function takeDamage(amount) {
    hp -= amount;
    if (hp <= 0) hp = 0;
    hpFill.style.width = hp + '%';
    
    if (hp < 30) {
        hpFill.style.background = '#ff0055';
        hpFill.style.boxShadow = '0 0 10px #ff0055';
    } else if (hp < 60) {
        hpFill.style.background = '#ffaa00';
        hpFill.style.boxShadow = '0 0 10px #ffaa00';
    }
    
    createExplosion(player.x, player.y, '#ff0055');
    
    if (hp <= 0) {
        gameOver();
    }
}

function update() {
    if (!gameActive) return;

    player.update();

    // Spawn bugs
    spawnTimer++;
    const spawnRate = Math.max(20, 80 - Math.floor(score / 50));
    if (spawnTimer > spawnRate) {
        bugs.push(new Bug());
        spawnTimer = 0;
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].update();
        if (lasers[i].y < -20) lasers.splice(i, 1);
    }

    // Update bugs & collision
    for (let i = bugs.length - 1; i >= 0; i--) {
        let bug = bugs[i];
        bug.update();

        // Hit player
        const dx = player.x - bug.x;
        const dy = player.y - bug.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < (player.width/2 + bug.width/2)) {
            takeDamage(15);
            createExplosion(bug.x, bug.y, bug.type.color);
            bugs.splice(i, 1);
            continue;
        }

        // Passed bottom
        if (bug.y > canvas.height + 30) {
            takeDamage(5);
            bugs.splice(i, 1);
            continue;
        }

        // Hit by laser
        for (let j = lasers.length - 1; j >= 0; j--) {
            let laser = lasers[j];
            if (laser.x > bug.x - bug.width/2 && 
                laser.x < bug.x + bug.width/2 && 
                laser.y > bug.y - bug.height/2 && 
                laser.y < bug.y + bug.height/2) {
                
                bug.hp--;
                lasers.splice(j, 1);
                createExplosion(laser.x, laser.y, '#ffffff');

                if(bug.hp <= 0) {
                    createExplosion(bug.x, bug.y, bug.type.color);
                    score += bug.maxHp * 10;
                    scoreEl.innerText = score;
                    bugs.splice(i, 1);
                }
                break;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => star.draw());
    
    if (gameActive) {
        player.draw();
        lasers.forEach(laser => laser.draw());
        bugs.forEach(bug => bug.draw());
    }
    
    particles.forEach(p => p.draw());
}

function animate() {
    update();
    draw();
    stars.forEach(star => star.update()); // Always update stars
    if(gameActive || particles.length > 0) {
        requestAnimationFrame(animate);
    } else if (!gameActive) {
        // Just draw stars when game is over but particles finished
        requestAnimationFrame(animateIdle);
    }
}

function animateIdle() {
    if(gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    requestAnimationFrame(animateIdle);
}

// Event Listeners
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Prevent default scrolling for space and arrows
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1 || e.key === ' ') {
        e.preventDefault();
    }
});

window.addEventListener('keyup', e => keys[e.key] = false);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

init();
animateIdle();
