module.exports = {
    apps: [{
        name: 'coinfo',
        script: './.output/server/index.mjs',
        interpreter: 'bun',
        args: ' run ',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'production',
            PORT: 7300,
        },
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        watch: false,
    }]
};