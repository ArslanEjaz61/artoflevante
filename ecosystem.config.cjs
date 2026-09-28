module.exports = {
  apps: [
    {
      name: "artoflevante",
      cwd: "/var/www/artoflevante",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3402",
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production" },
    },
  ],
};
