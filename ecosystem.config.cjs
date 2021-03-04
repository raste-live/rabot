const config = require('config');

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
      user : config.Deployment.User,
      host : config.Deployment.Host,
      path : config.Deployment.Path,
      ref  : 'origin/main',
      repo : 'git@github.com:raste-live/rabot.git',
      'pre-deploy-local': 'scp -r ./config ubuntu@52.79.158.156:/var/app/rabot/shared',
      'post-deploy' : 'npm install && pm2 startOrRestart app.js --env production',
      'post-setup': 'mkdir ../shared/config; ln -s ../shared/config config'
    }
  }
};
