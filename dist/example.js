function setup(simulator) {
    simulator.addBall(new Ball(unit.cm(160), unit.cm(53), new RGB(255, 0, 0)));
    simulator.addBall(new Ball(unit.cm(151), unit.cm(62), new RGB(0, 0, 255)));
    simulator.addBall(new Ball(unit.cm(160), unit.cm(62), new RGB(0, 0, 0)));
    simulator.addBall(new Ball(unit.cm(169), unit.cm(62), new RGB(150, 50, 50)));
    simulator.addBall(new Ball(unit.cm(160), unit.cm(71), new RGB(255, 0, 255)));
}

function main() {
    const canvas = document.documentElement.querySelector(".pool-table canvas");
    const simulator = new CuesportsSimulator(canvas);
    simulator.run();

    setup(simulator);

    const playerBall = new Ball(unit.cm(40), unit.cm(62), new RGB(255, 255, 255));
    playerBall.setVelocity(new Vec2(unit.cmps(800), unit.cmps(Math.random() * 150 - 75)));
    simulator.addBall(playerBall);

    let x = playerBall.p.x;
    let y = playerBall.p.y;

    canvas.addEventListener('mousemove', e => {
        const bb = canvas.getBoundingClientRect();
        x = e.clientX - bb.left;
        y = e.clientY - bb.top;
    });

    canvas.addEventListener('mousedown', _ => {
        // it will generate 1m/s^2 acceleration during $contants.dt$ toward mouse pointer.
        const rs = constants.rs;
        const f = new Vec2(unit.cm(x / rs), unit.cm(y / rs)).sub_(playerBall.p).normalize_();
        f.scale_(1000 * playerBall.m);
        playerBall.applyForce(f);
    });

    simulator.registerRenderHook(renderer => {
        const rs = constants.rs;
        const white = new RGB(255, 255, 255).toString();
        renderer.line(playerBall.p.x * 100, playerBall.p.y * 100, x / rs, y / rs, white);
        renderer.circle(x / rs, y / rs, 6 / rs, white);
    });
}

self.addEventListener('DOMContentLoaded', main);
