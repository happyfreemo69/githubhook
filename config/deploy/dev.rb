set :deploy_to, '/home/deployer/githubhook'
set :user, 'deployer'
set :pid_file_name, 'githubhook.pid'
set :branch, 'dev'
set :url_ping, 'https://githubhook-dev.citylity.com'
role :app, %w{deployer@185.8.50.133}
