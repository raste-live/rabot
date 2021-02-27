module.exports = {
  apps : [{
    name: 'app',
    script: './app.js',
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    }
  }],

  deploy : {
    production : {
      user : 'ubuntu',
      host : '52.79.158.156',
      ref  : 'origin/main',
      repo : 'git@github.com:raste-live/rabot.git',
      path : '/var/app/rabot',
      'pre-deploy-local': 'scp -r ./config ubuntu@52.79.158.156:/var/app/rabot/shared',
      'post-deploy' : 'ln -s ../shared/config config; npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
