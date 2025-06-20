class ParticleBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 150;
        this.mouse = { x: null, y: null };

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        const colors = [
            'rgba(22, 83, 159, 0.5)',   // Blue variant
            'rgba(21, 21, 21, 0.5)',    // Dark variant
            'rgba(255, 255, 255, 0.3)' // White variant
        ];

        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.7 + 0.3
        };
    }

    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fill();
    }

    updateParticle(particle) {
        // Movement
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Bounce off edges
        if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;

        // Mouse interaction
        if (this.mouse.x && this.mouse.y) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Repel particles within 50px of mouse
            if (distance < 50) {
                particle.speedX += dx / distance * 0.5;
                particle.speedY += dy / distance * 0.5;
            }
        }

        // Add subtle swirling motion
        particle.x += Math.sin(particle.y * 0.01) * 0.5;
        particle.y += Math.cos(particle.x * 0.01) * 0.5;
    }

    setupEventListeners() {
        // Mouse move tracking
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        });

        // Reset mouse when leaving canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Responsive canvas resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
            this.updateParticle(particle);
            this.drawParticle(particle);
        });

        // Connect nearby particles with lines
        this.particles.forEach((p1, index) => {
            for (let j = index + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Draw lines between close particles
                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        });

        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background-canvas');
    new ParticleBackground(canvas);
});