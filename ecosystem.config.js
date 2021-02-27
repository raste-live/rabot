module.exports = {
  apps : [{
    name: 'app',
    script: './app.js',
    env: {
      NODE_ENV: "development",
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3009,
    }
  }],

  deploy : {
    production : {
      user : 'ubuntu',
      host : 'broadcast.raste.live',
      ref  : 'origin/main',
      repo : 'git@github.com:raste-live/rabot.git',
      path : '/var/app/rabot',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
