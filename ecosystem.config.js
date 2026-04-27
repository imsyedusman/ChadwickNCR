module.exports = {
  apps: [
    {
      name: 'ncr-server',
      script: 'server/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
