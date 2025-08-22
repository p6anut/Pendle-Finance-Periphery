module.exports = {
  apps: [
    {
      name: 'pendle-cron',
      script: 'ts-node',
      args: 'src/main.ts',
      cwd: '/Users/huangxiao/Desktop/work/web3/sigma/pendle-generic-balance-fetcher', // 替换为你的项目绝对路径
      autorestart: false,
      cron_restart: '0 0 * * *', // 每天0点执行
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
