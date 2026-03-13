module.exports = {
  apps: [{
    name: 'cintic-prod',
    script: 'server.js',
    instances: 2, // Utilize both CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
